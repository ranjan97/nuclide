'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {
  DiffModeType,
  NavigationSection,
  NavigationSectionStatusType,
} from './types';
import type DiffViewModel from './DiffViewModel';
import type {RevisionInfo} from '../../nuclide-hg-rpc/lib/HgService';

import invariant from 'assert';
import {MultiRootChangedFilesView} from '../../nuclide-ui/MultiRootChangedFilesView';
import {Disposable, TextBuffer} from 'atom';
import UniversalDisposable from '../../commons-node/UniversalDisposable';
import {
  React,
  ReactDOM,
} from 'react-for-atom';
import DiffViewEditorPane from './DiffViewEditorPane';
import SyncScroll from './SyncScroll';
import DiffTimelineView from './DiffTimelineView';
import DiffViewToolbar from './DiffViewToolbar';
import DiffNavigationBar from './DiffNavigationBar';
import DiffCommitView from './DiffCommitView';
import DiffPublishView from './DiffPublishView';
import createPaneContainer from '../../commons-atom/create-pane-container';
import {bufferForUri} from '../../commons-atom/text-editor';
import {
  DiffMode,
  NavigationSectionStatus,
} from './constants';
import {getMultiRootFileChanges} from '../../nuclide-hg-git-bridge/lib/utils';
import {
  LoadingSpinner,
  LoadingSpinnerSizes,
} from '../../nuclide-ui/LoadingSpinner';
import {observableFromSubscribeFunction} from '../../commons-node/event';
import {Observable} from 'rxjs';

type Props = {
  diffModel: DiffViewModel,
  // A bound function that when invoked will try to trigger the Diff View NUX
  tryTriggerNux: () => void,
};

type State = {
  selectedNavigationSectionIndex: number,
};

let CachedPublishComponent;
function getPublishComponent() {
  if (CachedPublishComponent == null) {
    // Try requiring private module
    try {
      // $FlowFB
      const {DiffViewPublishForm} = require('./fb/DiffViewPublishForm');
      CachedPublishComponent = DiffViewPublishForm;
    } catch (ex) {
      CachedPublishComponent = DiffPublishView;
    }
  }
  return CachedPublishComponent;
}

let CachedDiffComponent;
function getDiffComponent() {
  if (CachedDiffComponent == null) {
    // Try requiring private module
    try {
      // $FlowFB
      const {DiffViewCreateForm} = require('./fb/DiffViewCreateForm');
      CachedDiffComponent = DiffViewCreateForm;
    } catch (ex) {
      CachedDiffComponent = DiffCommitView;
    }
  }

  return CachedDiffComponent;
}

function getInitialState(): State {
  return {
    selectedNavigationSectionIndex: -1,
  };
}

const EMPTY_FUNCTION = () => {};
const SCROLL_FIRST_CHANGE_DELAY_MS = 100;
const DEBOUNCE_STATE_UPDATES_MS = 50;

export default class DiffViewComponent extends React.Component {
  props: Props;
  state: State;

  _subscriptions: UniversalDisposable;
  _syncScroll: SyncScroll;
  _oldEditorPane: atom$Pane;
  _oldEditorComponent: DiffViewEditorPane;
  _paneContainer: Object;
  _newEditorPane: atom$Pane;
  _newEditorComponent: DiffViewEditorPane;
  _bottomRightPane: atom$Pane;
  _timelineComponent: ?DiffTimelineView;
  _treePane: atom$Pane;
  _treeComponent: React.Component<any, any, any>;
  _navigationPane: atom$Pane;
  _navigationComponent: DiffNavigationBar;
  _publishComponent: ?React.Component<any, any, any>;
  _readonlyBuffer: atom$TextBuffer;

  constructor(props: Props) {
    super(props);
    this.state = getInitialState();
    (this: any)._onTimelineChangeRevision = this._onTimelineChangeRevision.bind(this);
    (this: any)._handleNavigateToNavigationSection =
      this._handleNavigateToNavigationSection.bind(this);
    (this: any)._onDidUpdateTextEditorElement = this._onDidUpdateTextEditorElement.bind(this);
    (this: any)._onChangeMode = this._onChangeMode.bind(this);
    (this: any)._onSwitchToEditor = this._onSwitchToEditor.bind(this);
    (this: any)._onDidChangeScrollTop = this._onDidChangeScrollTop.bind(this);
    (this: any)._pixelRangeForNavigationSection = this._pixelRangeForNavigationSection.bind(this);
    this._readonlyBuffer = new TextBuffer();
    this._subscriptions = new UniversalDisposable();
  }

  componentDidMount(): void {
    const {diffModel, tryTriggerNux} = this.props;
    const stateUpdates = observableFromSubscribeFunction(
      diffModel.onDidUpdateState.bind(diffModel))
      .map(() => diffModel.getState());
    this._subscriptions.add(
      Observable.merge(
        stateUpdates,
        observableFromSubscribeFunction(
          atom.workspace.onDidChangeActivePaneItem.bind(atom.workspace)),
      ).filter(() => {
        const activeItem = atom.workspace.getActivePaneItem();
        return activeItem != null && (activeItem: any).tagName === 'NUCLIDE-DIFF-VIEW';
      })
      .debounceTime(DEBOUNCE_STATE_UPDATES_MS)
      .subscribe(() => {
        this.forceUpdate();
      }),

      // Scroll to the first navigation section when diffing a file.
      stateUpdates.map(({fileDiff}) => fileDiff.filePath)
        .distinctUntilChanged()
        .switchMap(filePath => {
          // Clear prior subscriptions on file switch.
          if (!filePath) {
            return Observable.empty();
          }
          return Observable.concat(
            // Wait for the diff text to load.
            stateUpdates.filter(({fileDiff}) => fileDiff.oldEditorState.text.length > 0)
              .first().ignoreElements(),
            // Wait for the diff editor to render the UI state.
            Observable.interval(SCROLL_FIRST_CHANGE_DELAY_MS).first(),
          );
        }).subscribe(() => this._scrollToFirstHighlightedLine()),
    );

    this._paneContainer = createPaneContainer();
    // The changed files status tree takes 1/5 of the width and lives on the right most,
    // while being vertically splt with the revision timeline stack pane.
    const topPane = this._newEditorPane = this._paneContainer.getActivePane();
    this._bottomRightPane = topPane.splitDown({
      flexScale: 0.3,
    });
    this._treePane = this._bottomRightPane.splitLeft({
      flexScale: 0.35,
    });
    this._navigationPane = topPane.splitRight({
      flexScale: 0.045,
    });
    this._oldEditorPane = topPane.splitLeft({
      flexScale: 1,
    });

    this._renderDiffView();

    this._subscriptions.add(
      this._destroyPaneDisposable(this._oldEditorPane),
      this._destroyPaneDisposable(this._newEditorPane),
      this._destroyPaneDisposable(this._navigationPane),
      this._destroyPaneDisposable(this._treePane),
      this._destroyPaneDisposable(this._bottomRightPane),
    );

    ReactDOM.findDOMNode(this.refs.paneContainer).appendChild(
      atom.views.getView(this._paneContainer),
    );

    tryTriggerNux();
  }

  _setupSyncScroll(): void {
    if (this._oldEditorComponent == null || this._newEditorComponent == null) {
      return;
    }
    const oldTextEditorElement = this._oldEditorComponent.getEditorDomElement();
    const newTextEditorElement = this._newEditorComponent.getEditorDomElement();
    const syncScroll = this._syncScroll;
    if (syncScroll != null) {
      syncScroll.dispose();
      this._subscriptions.remove(syncScroll);
    }
    this._syncScroll = new SyncScroll(
      oldTextEditorElement,
      newTextEditorElement,
    );
    this._subscriptions.add(this._syncScroll);
  }

  _scrollToFirstHighlightedLine(): void {
    const {fileDiff: {navigationSections}} = this.props.diffModel.getState();
    if (navigationSections.length === 0) {
      return;
    }

    const {status, lineNumber} = navigationSections[0];
    this._handleNavigateToNavigationSection(status, lineNumber);
  }

  _onChangeMode(mode: DiffModeType): void {
    this.props.diffModel.setViewMode(mode);
  }

  _renderDiffView(): void {
    this._renderTree();
    this._renderEditors();
    this._renderNavigation();
    this._renderBottomRightPane();
  }

  _renderBottomRightPane(): void {
    const {viewMode} = this.props.diffModel.getState();
    switch (viewMode) {
      case DiffMode.BROWSE_MODE:
        this._renderTimelineView();
        this._publishComponent = null;
        break;
      case DiffMode.COMMIT_MODE:
        this._renderCommitView();
        this._timelineComponent = null;
        this._publishComponent = null;
        break;
      case DiffMode.PUBLISH_MODE:
        this._renderPublishView();
        this._timelineComponent = null;
        break;
      default:
        throw new Error(`Invalid Diff Mode: ${viewMode}`);
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    this._renderDiffView();
    this.props.diffModel.emitActiveBufferChangeModified();
  }

  _renderCommitView(): void {
    const {
      commitMessage,
      commitMode,
      commitModeState,
      shouldRebaseOnAmend,
    } = this.props.diffModel.getState();

    const DiffComponent = getDiffComponent();
    ReactDOM.render(
      <DiffComponent
        commitMessage={commitMessage}
        commitMode={commitMode}
        commitModeState={commitModeState}
        shouldRebaseOnAmend={shouldRebaseOnAmend}
        // `diffModel` is acting as the action creator for commit view and needs to be passed so
        // methods can be called on it.
        diffModel={this.props.diffModel}
      />,
      this._getPaneElement(this._bottomRightPane),
    );
  }

  _renderPublishView(): void {
    const {diffModel} = this.props;
    const {
      publishMode,
      publishModeState,
      publishMessage,
      headCommitMessage,
    } = diffModel.getState();
    const PublishComponent = getPublishComponent();
    const component = ReactDOM.render(
      <PublishComponent
        publishModeState={publishModeState}
        message={publishMessage}
        publishMode={publishMode}
        headCommitMessage={headCommitMessage}
        diffModel={diffModel}
      />,
      this._getPaneElement(this._bottomRightPane),
    );
    this._publishComponent = component;
  }

  _renderTree(): void {
    const {diffModel} = this.props;
    const {
      activeRepository,
      fileDiff,
      isLoadingSelectedFiles,
      selectedFileChanges,
    } = diffModel.getState();
    const rootPaths = activeRepository != null ? [activeRepository.getWorkingDirectory()] : [];

    let spinnerElement = null;
    if (isLoadingSelectedFiles) {
      spinnerElement = (
        <div className="nuclide-diff-view-loading inline-block">
          <LoadingSpinner
            className="inline-block"
            size={LoadingSpinnerSizes.EXTRA_SMALL}
          />
          <div className="inline-block">
            Refreshing Selected Files …
          </div>
        </div>
      );
    }

    this._treeComponent = ReactDOM.render(
      (
        <div className="nuclide-diff-view-tree padded">
          {spinnerElement}
          <MultiRootChangedFilesView
            commandPrefix="nuclide-diff-view"
            fileChanges={getMultiRootFileChanges(selectedFileChanges, rootPaths)}
            selectedFile={fileDiff.filePath}
            onFileChosen={diffModel.diffFile.bind(diffModel)}
          />
        </div>
      ),
      this._getPaneElement(this._treePane),
    );
  }

  _renderEditors(): void {
    const {
      fileDiff,
      isLoadingFileDiff,
    } = this.props.diffModel.getState();

    const {
      filePath,
      lineMapping,
      newEditorState: newState,
      oldEditorState: oldState,
    } = fileDiff;
    const oldEditorComponent = ReactDOM.render(
        <DiffViewEditorPane
          headerTitle={oldState.revisionTitle}
          textBuffer={this._readonlyBuffer}
          filePath={filePath}
          isLoading={isLoadingFileDiff}
          offsets={oldState.offsets}
          lineMapper={lineMapping.newToOld}
          highlightedLines={oldState.highlightedLines}
          textContent={oldState.text}
          inlineElements={oldState.inlineElements}
          inlineOffsetElements={oldState.inlineOffsetElements}
          readOnly={true}
          onDidChangeScrollTop={this._onDidChangeScrollTop}
          onDidUpdateTextEditorElement={EMPTY_FUNCTION}
        />,
        this._getPaneElement(this._oldEditorPane),
    );
    invariant(oldEditorComponent instanceof DiffViewEditorPane);
    this._oldEditorComponent = oldEditorComponent;
    const textBuffer = bufferForUri(filePath);
    const newEditorComponent = ReactDOM.render(
        <DiffViewEditorPane
          headerTitle={newState.revisionTitle}
          textBuffer={textBuffer}
          filePath={filePath}
          isLoading={isLoadingFileDiff}
          offsets={newState.offsets}
          lineMapper={lineMapping.oldToNew}
          highlightedLines={newState.highlightedLines}
          inlineElements={newState.inlineElements}
          inlineOffsetElements={newState.inlineOffsetElements}
          onDidUpdateTextEditorElement={this._onDidUpdateTextEditorElement}
          readOnly={false}
        />,
        this._getPaneElement(this._newEditorPane),
    );
    invariant(newEditorComponent instanceof DiffViewEditorPane);
    this._newEditorComponent = newEditorComponent;
  }

  _onDidUpdateTextEditorElement(): void {
    this._setupSyncScroll();
  }

  _renderTimelineView(): void {
    const component = ReactDOM.render(
      <DiffTimelineView
        diffModel={this.props.diffModel}
        onSelectionChange={this._onTimelineChangeRevision}
      />,
      this._getPaneElement(this._bottomRightPane),
    );
    invariant(component instanceof DiffTimelineView);
    this._timelineComponent = component;
  }

  _renderNavigation(): void {
    const {fileDiff: {navigationSections}} = this.props.diffModel.getState();
    const navigationPaneElement = this._getPaneElement(this._navigationPane);
    const oldEditorElement = this._oldEditorComponent.getEditorDomElement();
    const newEditorElement = this._newEditorComponent.getEditorDomElement();
    const diffViewHeight = Math.max(
      oldEditorElement.getScrollHeight(),
      newEditorElement.getScrollHeight(),
      1, // Protect against zero scroll height while initializring editors.
    );
    const component = ReactDOM.render(
      <DiffNavigationBar
        navigationSections={navigationSections}
        navigationScale={navigationPaneElement.clientHeight / diffViewHeight}
        editorLineHeight={oldEditorElement.getModel().getLineHeightInPixels()}
        pixelRangeForNavigationSection={this._pixelRangeForNavigationSection}
        onNavigateToNavigationSection={this._handleNavigateToNavigationSection}
      />,
      navigationPaneElement,
    );
    invariant(component instanceof DiffNavigationBar);
    this._navigationComponent = component;
  }

  _handleNavigateToNavigationSection(
    navigationSectionStatus: NavigationSectionStatusType,
    scrollToLineNumber: number,
  ): void {
    const textEditorElement = this._navigationSectionStatusToEditorElement(navigationSectionStatus);
    const textEditor = textEditorElement.getModel();
    const pixelPositionTop = textEditorElement
      .pixelPositionForBufferPosition([scrollToLineNumber, 0]).top;
    // Manually calculate the scroll location, instead of using
    // `textEditor.scrollToBufferPosition([lineNumber, 0], {center: true})`
    // because that API to wouldn't center the line if it was in the visible screen range.
    const scrollTop = pixelPositionTop
      + textEditor.getLineHeightInPixels() / 2
      - textEditorElement.clientHeight / 2;
    textEditorElement.setScrollTop(Math.max(scrollTop, 1));
  }

  _pixelRangeForNavigationSection(
    navigationSection: NavigationSection,
  ): {top: number, bottom: number} {
    const {status, lineNumber, lineCount} = navigationSection;
    const textEditorElement = this._navigationSectionStatusToEditorElement(status);
    const lineHeight = textEditorElement.getModel().getLineHeightInPixels();
    return {
      top: textEditorElement.pixelPositionForBufferPosition([lineNumber, 0]).top,
      bottom: textEditorElement.pixelPositionForBufferPosition([lineNumber + lineCount - 1, 0]).top
        + lineHeight,
    };
  }

  _navigationSectionStatusToEditorElement(
    navigationSectionStatus: NavigationSectionStatusType,
  ): atom$TextEditorElement {
    switch (navigationSectionStatus) {
      case NavigationSectionStatus.ADDED:
      case NavigationSectionStatus.CHANGED:
      case NavigationSectionStatus.NEW_ELEMENT:
        return this._newEditorComponent.getEditorDomElement();
      case NavigationSectionStatus.REMOVED:
      case NavigationSectionStatus.OLD_ELEMENT:
        return this._oldEditorComponent.getEditorDomElement();
      default:
        throw new Error('Invalid diff section status');
    }
  }

  _getPaneElement(pane: atom$Pane): HTMLElement {
    return atom.views.getView(pane).querySelector('.item-views');
  }

  _destroyPaneDisposable(pane: atom$Pane): IDisposable {
    return new Disposable(() => {
      ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this._getPaneElement(pane)));
      pane.destroy();
    });
  }

  componentWillUnmount(): void {
    this._subscriptions.dispose();
  }

  render(): React.Element<any> {
    const {
      selectedNavigationSectionIndex,
    } = this.state;
    const {
      filePath,
      newEditorState,
      oldEditorState,
      navigationSections,
    } = this.props.diffModel.getState().fileDiff;

    return (
      <div className="nuclide-diff-view-container">
        <DiffViewToolbar
          navigationSections={navigationSections}
          filePath={filePath}
          selectedNavigationSectionIndex={selectedNavigationSectionIndex}
          newRevisionTitle={newEditorState.revisionTitle}
          oldRevisionTitle={oldEditorState.revisionTitle}
          onSwitchMode={this._onChangeMode}
          onSwitchToEditor={this._onSwitchToEditor}
          onNavigateToNavigationSection={this._handleNavigateToNavigationSection}
        />
        <div className="nuclide-diff-view-component" ref="paneContainer" />
      </div>
    );
  }

  _onSwitchToEditor(): void {
    const diffViewNode = ReactDOM.findDOMNode(this);
    invariant(diffViewNode, 'Diff View DOM needs to be attached to switch to editor mode');
    atom.commands.dispatch(diffViewNode, 'nuclide-diff-view:switch-to-editor');
  }

  _onTimelineChangeRevision(revision: RevisionInfo): void {
    this.props.diffModel.setCompareRevision(revision);
  }

  _onDidChangeScrollTop(): void {
    const editorElements = [
      this._oldEditorComponent.getEditorDomElement(),
      this._newEditorComponent.getEditorDomElement(),
    ];

    const elementsScrollCenter = editorElements.map(editorElement => {
      const scrollTop = editorElement.getScrollTop();
      return scrollTop + editorElement.clientHeight / 2;
    });

    let selectedNavigationSectionIndex = -1;

    const {fileDiff: {navigationSections}} = this.props.diffModel.getState();
    // TODO(most): Pre-compute the positions of the diff sections.
    // Q: when to invalidate (line edits, UI elements & diff reloads, ..etc.)
    for (let sectionIndex = 0; sectionIndex < navigationSections.length; sectionIndex++) {
      const {status, lineNumber} = navigationSections[sectionIndex];
      const textEditorElement = this._navigationSectionStatusToEditorElement(status);
      const sectionPixelTop = textEditorElement
        .pixelPositionForBufferPosition([lineNumber, 0]).top;

      const sectionEditorIndex = editorElements.indexOf(textEditorElement);
      const sectionEditorScrollCenter = elementsScrollCenter[sectionEditorIndex];

      if (sectionEditorScrollCenter >= sectionPixelTop) {
        selectedNavigationSectionIndex = sectionIndex;
      }
    }

    this.setState({selectedNavigationSectionIndex});
  }
}
