function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _featureConfig = require('../../feature-config');

var _featureConfig2 = _interopRequireDefault(_featureConfig);

var _client = require('../../client');

var _analytics = require('../../analytics');

var _constantsJs = require('./constants.js');

var invariant = require('assert');

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var GRAMMARS_STRING = _constantsJs.JS_GRAMMARS.join(', ');
var diagnosticsOnFlySetting = 'nuclide-flow.diagnosticsOnFly';

var PACKAGE_NAME = 'nuclide-flow';

var busySignalProvider = undefined;

var flowDiagnosticsProvider = undefined;

var disposables = undefined;

module.exports = {
  activate: function activate() {
    if (!disposables) {
      disposables = new CompositeDisposable();

      var _require2 = require('../../atom-helpers');

      var registerGrammarForFileExtension = _require2.registerGrammarForFileExtension;

      registerGrammarForFileExtension('source.ini', '.flowconfig');
    }
  },

  /** Provider for autocomplete service. */
  createAutocompleteProvider: function createAutocompleteProvider() {
    var AutocompleteProvider = require('./FlowAutocompleteProvider');
    var autocompleteProvider = new AutocompleteProvider();
    var getSuggestions = autocompleteProvider.getSuggestions.bind(autocompleteProvider);
    return {
      selector: _constantsJs.JS_GRAMMARS.map(function (grammar) {
        return '.' + grammar;
      }).join(', '),
      disableForSelector: '.source.js .comment',
      inclusionPriority: 1,
      // We want to get ranked higher than the snippets provider.
      suggestionPriority: 5,
      onDidInsertSuggestion: function onDidInsertSuggestion() {
        (0, _analytics.track)('nuclide-flow.autocomplete-chosen');
      },
      getSuggestions: getSuggestions
    };
  },

  getHyperclickProvider: function getHyperclickProvider() {
    var FlowHyperclickProvider = require('./FlowHyperclickProvider');
    var flowHyperclickProvider = new FlowHyperclickProvider();
    var getSuggestionForWord = flowHyperclickProvider.getSuggestionForWord.bind(flowHyperclickProvider);
    return {
      wordRegExp: _constantsJs.JAVASCRIPT_WORD_REGEX,
      priority: 20,
      providerName: PACKAGE_NAME,
      getSuggestionForWord: getSuggestionForWord
    };
  },

  provideBusySignal: function provideBusySignal() {
    if (!busySignalProvider) {
      var _require3 = require('../../busy-signal-provider-base');

      var DedupedBusySignalProviderBase = _require3.DedupedBusySignalProviderBase;

      busySignalProvider = new DedupedBusySignalProviderBase();
    }
    return busySignalProvider;
  },

  provideDiagnostics: function provideDiagnostics() {
    if (!flowDiagnosticsProvider) {
      var busyProvider = this.provideBusySignal();
      var FlowDiagnosticsProvider = require('./FlowDiagnosticsProvider');
      var runOnTheFly = _featureConfig2['default'].get(diagnosticsOnFlySetting);
      flowDiagnosticsProvider = new FlowDiagnosticsProvider(runOnTheFly, busyProvider);
      invariant(disposables);
      disposables.add(_featureConfig2['default'].observe(diagnosticsOnFlySetting, function (newValue) {
        invariant(flowDiagnosticsProvider);
        flowDiagnosticsProvider.setRunOnTheFly(newValue);
      }));

      var _require4 = require('../../atom-helpers');

      var projects = _require4.projects;

      disposables.add(projects.onDidRemoveProjectPath(function (projectPath) {
        invariant(flowDiagnosticsProvider);
        flowDiagnosticsProvider.invalidateProjectPath(projectPath);
      }));
    }
    return flowDiagnosticsProvider;
  },

  provideOutlines: function provideOutlines() {
    var _require5 = require('./FlowOutlineProvider');

    var FlowOutlineProvider = _require5.FlowOutlineProvider;

    var provider = new FlowOutlineProvider();
    return {
      grammarScopes: _constantsJs.JS_GRAMMARS,
      priority: 1,
      name: 'Flow',
      getOutline: provider.getOutline.bind(provider)
    };
  },

  createTypeHintProvider: function createTypeHintProvider() {
    var _require6 = require('./FlowTypeHintProvider');

    var FlowTypeHintProvider = _require6.FlowTypeHintProvider;

    var flowTypeHintProvider = new FlowTypeHintProvider();
    var typeHint = flowTypeHintProvider.typeHint.bind(flowTypeHintProvider);
    return {
      selector: GRAMMARS_STRING,
      providerName: PACKAGE_NAME,
      inclusionPriority: 1,
      typeHint: typeHint
    };
  },

  deactivate: function deactivate() {
    // TODO(mbolin): Find a way to unregister the autocomplete provider from
    // ServiceHub, or set a boolean in the autocomplete provider to always return
    // empty results.
    var service = (0, _client.getServiceByNuclideUri)('FlowService');
    invariant(service);
    service.dispose();
    if (disposables) {
      disposables.dispose();
      disposables = null;
    }
    if (flowDiagnosticsProvider) {
      flowDiagnosticsProvider.dispose();
      flowDiagnosticsProvider = null;
    }
  }
};
//# sourceMappingURL=data:application/json;base64,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b0JBQW9CLEVBQUUsQ0FBQztBQUN4RCxRQUFNLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDMUUsV0FBTztBQUNMLGNBQVEsRUFBRSxlQUFlO0FBQ3pCLGtCQUFZLEVBQUUsWUFBWTtBQUMxQix1QkFBaUIsRUFBRSxDQUFDO0FBQ3BCLGNBQVEsRUFBUixRQUFRO0tBQ1QsQ0FBQztHQUNIOztBQUVELFlBQVUsRUFBQSxzQkFBRzs7OztBQUlYLFFBQU0sT0FBTyxHQUFHLG9DQUF1QixhQUFhLENBQUMsQ0FBQztBQUN0RCxhQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbkIsV0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2xCLFFBQUksV0FBVyxFQUFFO0FBQ2YsaUJBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QixpQkFBVyxHQUFHLElBQUksQ0FBQztLQUNwQjtBQUNELFFBQUksdUJBQXVCLEVBQUU7QUFDM0IsNkJBQXVCLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEMsNkJBQXVCLEdBQUcsSUFBSSxDQUFDO0tBQ2hDO0dBQ0Y7Q0FDRixDQUFDIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7SHlwZXJjbGlja1Byb3ZpZGVyfSBmcm9tICcuLi8uLi9oeXBlcmNsaWNrLWludGVyZmFjZXMnO1xuaW1wb3J0IHR5cGUge1xuICBCdXN5U2lnbmFsUHJvdmlkZXJCYXNlIGFzIEJ1c3lTaWduYWxQcm92aWRlckJhc2VUeXBlLFxufSBmcm9tICcuLi8uLi9idXN5LXNpZ25hbC1wcm92aWRlci1iYXNlJztcbmltcG9ydCB0eXBlIHtPdXRsaW5lUHJvdmlkZXJ9IGZyb20gJy4uLy4uL291dGxpbmUtdmlldyc7XG5cbmNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xuY29uc3Qge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xuXG5pbXBvcnQgZmVhdHVyZUNvbmZpZyBmcm9tICcuLi8uLi9mZWF0dXJlLWNvbmZpZyc7XG5pbXBvcnQge2dldFNlcnZpY2VCeU51Y2xpZGVVcml9IGZyb20gJy4uLy4uL2NsaWVudCc7XG5pbXBvcnQge3RyYWNrfSBmcm9tICcuLi8uLi9hbmFseXRpY3MnO1xuXG5pbXBvcnQge0pTX0dSQU1NQVJTLCBKQVZBU0NSSVBUX1dPUkRfUkVHRVh9IGZyb20gJy4vY29uc3RhbnRzLmpzJztcbmNvbnN0IEdSQU1NQVJTX1NUUklORyA9IEpTX0dSQU1NQVJTLmpvaW4oJywgJyk7XG5jb25zdCBkaWFnbm9zdGljc09uRmx5U2V0dGluZyA9ICdudWNsaWRlLWZsb3cuZGlhZ25vc3RpY3NPbkZseSc7XG5cbmNvbnN0IFBBQ0tBR0VfTkFNRSA9ICdudWNsaWRlLWZsb3cnO1xuXG5sZXQgYnVzeVNpZ25hbFByb3ZpZGVyO1xuXG5sZXQgZmxvd0RpYWdub3N0aWNzUHJvdmlkZXI7XG5cbmxldCBkaXNwb3NhYmxlcztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFjdGl2YXRlKCkge1xuICAgIGlmICghZGlzcG9zYWJsZXMpIHtcbiAgICAgIGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgICAgY29uc3Qge3JlZ2lzdGVyR3JhbW1hckZvckZpbGVFeHRlbnNpb259ID0gcmVxdWlyZSgnLi4vLi4vYXRvbS1oZWxwZXJzJyk7XG4gICAgICByZWdpc3RlckdyYW1tYXJGb3JGaWxlRXh0ZW5zaW9uKCdzb3VyY2UuaW5pJywgJy5mbG93Y29uZmlnJyk7XG4gICAgfVxuICB9LFxuXG4gIC8qKiBQcm92aWRlciBmb3IgYXV0b2NvbXBsZXRlIHNlcnZpY2UuICovXG4gIGNyZWF0ZUF1dG9jb21wbGV0ZVByb3ZpZGVyKCk6IGF0b20kQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICAgIGNvbnN0IEF1dG9jb21wbGV0ZVByb3ZpZGVyID0gcmVxdWlyZSgnLi9GbG93QXV0b2NvbXBsZXRlUHJvdmlkZXInKTtcbiAgICBjb25zdCBhdXRvY29tcGxldGVQcm92aWRlciA9IG5ldyBBdXRvY29tcGxldGVQcm92aWRlcigpO1xuICAgIGNvbnN0IGdldFN1Z2dlc3Rpb25zID0gYXV0b2NvbXBsZXRlUHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbnMuYmluZChhdXRvY29tcGxldGVQcm92aWRlcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNlbGVjdG9yOiBKU19HUkFNTUFSUy5tYXAoZ3JhbW1hciA9PiAnLicgKyBncmFtbWFyKS5qb2luKCcsICcpLFxuICAgICAgZGlzYWJsZUZvclNlbGVjdG9yOiAnLnNvdXJjZS5qcyAuY29tbWVudCcsXG4gICAgICBpbmNsdXNpb25Qcmlvcml0eTogMSxcbiAgICAgIC8vIFdlIHdhbnQgdG8gZ2V0IHJhbmtlZCBoaWdoZXIgdGhhbiB0aGUgc25pcHBldHMgcHJvdmlkZXIuXG4gICAgICBzdWdnZXN0aW9uUHJpb3JpdHk6IDUsXG4gICAgICBvbkRpZEluc2VydFN1Z2dlc3Rpb246ICgpID0+IHtcbiAgICAgICAgdHJhY2soJ251Y2xpZGUtZmxvdy5hdXRvY29tcGxldGUtY2hvc2VuJyk7XG4gICAgICB9LFxuICAgICAgZ2V0U3VnZ2VzdGlvbnMsXG4gICAgfTtcbiAgfSxcblxuICBnZXRIeXBlcmNsaWNrUHJvdmlkZXIoKTogSHlwZXJjbGlja1Byb3ZpZGVyIHtcbiAgICBjb25zdCBGbG93SHlwZXJjbGlja1Byb3ZpZGVyID0gcmVxdWlyZSgnLi9GbG93SHlwZXJjbGlja1Byb3ZpZGVyJyk7XG4gICAgY29uc3QgZmxvd0h5cGVyY2xpY2tQcm92aWRlciA9IG5ldyBGbG93SHlwZXJjbGlja1Byb3ZpZGVyKCk7XG4gICAgY29uc3QgZ2V0U3VnZ2VzdGlvbkZvcldvcmQgPVxuICAgICAgICBmbG93SHlwZXJjbGlja1Byb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkLmJpbmQoZmxvd0h5cGVyY2xpY2tQcm92aWRlcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHdvcmRSZWdFeHA6IEpBVkFTQ1JJUFRfV09SRF9SRUdFWCxcbiAgICAgIHByaW9yaXR5OiAyMCxcbiAgICAgIHByb3ZpZGVyTmFtZTogUEFDS0FHRV9OQU1FLFxuICAgICAgZ2V0U3VnZ2VzdGlvbkZvcldvcmQsXG4gICAgfTtcbiAgfSxcblxuICBwcm92aWRlQnVzeVNpZ25hbCgpOiBCdXN5U2lnbmFsUHJvdmlkZXJCYXNlVHlwZSB7XG4gICAgaWYgKCFidXN5U2lnbmFsUHJvdmlkZXIpIHtcbiAgICAgIGNvbnN0IHtEZWR1cGVkQnVzeVNpZ25hbFByb3ZpZGVyQmFzZX0gPSByZXF1aXJlKCcuLi8uLi9idXN5LXNpZ25hbC1wcm92aWRlci1iYXNlJyk7XG4gICAgICBidXN5U2lnbmFsUHJvdmlkZXIgPSBuZXcgRGVkdXBlZEJ1c3lTaWduYWxQcm92aWRlckJhc2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1c3lTaWduYWxQcm92aWRlcjtcbiAgfSxcblxuICBwcm92aWRlRGlhZ25vc3RpY3MoKSB7XG4gICAgaWYgKCFmbG93RGlhZ25vc3RpY3NQcm92aWRlcikge1xuICAgICAgY29uc3QgYnVzeVByb3ZpZGVyID0gdGhpcy5wcm92aWRlQnVzeVNpZ25hbCgpO1xuICAgICAgY29uc3QgRmxvd0RpYWdub3N0aWNzUHJvdmlkZXIgPSByZXF1aXJlKCcuL0Zsb3dEaWFnbm9zdGljc1Byb3ZpZGVyJyk7XG4gICAgICBjb25zdCBydW5PblRoZUZseSA9ICgoZmVhdHVyZUNvbmZpZy5nZXQoZGlhZ25vc3RpY3NPbkZseVNldHRpbmcpOiBhbnkpOiBib29sZWFuKTtcbiAgICAgIGZsb3dEaWFnbm9zdGljc1Byb3ZpZGVyID0gbmV3IEZsb3dEaWFnbm9zdGljc1Byb3ZpZGVyKHJ1bk9uVGhlRmx5LCBidXN5UHJvdmlkZXIpO1xuICAgICAgaW52YXJpYW50KGRpc3Bvc2FibGVzKTtcbiAgICAgIGRpc3Bvc2FibGVzLmFkZChmZWF0dXJlQ29uZmlnLm9ic2VydmUoZGlhZ25vc3RpY3NPbkZseVNldHRpbmcsIG5ld1ZhbHVlID0+IHtcbiAgICAgICAgaW52YXJpYW50KGZsb3dEaWFnbm9zdGljc1Byb3ZpZGVyKTtcbiAgICAgICAgZmxvd0RpYWdub3N0aWNzUHJvdmlkZXIuc2V0UnVuT25UaGVGbHkobmV3VmFsdWUpO1xuICAgICAgfSkpO1xuICAgICAgY29uc3Qge3Byb2plY3RzfSA9IHJlcXVpcmUoJy4uLy4uL2F0b20taGVscGVycycpO1xuICAgICAgZGlzcG9zYWJsZXMuYWRkKHByb2plY3RzLm9uRGlkUmVtb3ZlUHJvamVjdFBhdGgocHJvamVjdFBhdGggPT4ge1xuICAgICAgICBpbnZhcmlhbnQoZmxvd0RpYWdub3N0aWNzUHJvdmlkZXIpO1xuICAgICAgICBmbG93RGlhZ25vc3RpY3NQcm92aWRlci5pbnZhbGlkYXRlUHJvamVjdFBhdGgocHJvamVjdFBhdGgpO1xuICAgICAgfSkpO1xuICAgIH1cbiAgICByZXR1cm4gZmxvd0RpYWdub3N0aWNzUHJvdmlkZXI7XG4gIH0sXG5cbiAgcHJvdmlkZU91dGxpbmVzKCk6IE91dGxpbmVQcm92aWRlciB7XG4gICAgY29uc3Qge0Zsb3dPdXRsaW5lUHJvdmlkZXJ9ID0gcmVxdWlyZSgnLi9GbG93T3V0bGluZVByb3ZpZGVyJyk7XG4gICAgY29uc3QgcHJvdmlkZXIgPSBuZXcgRmxvd091dGxpbmVQcm92aWRlcigpO1xuICAgIHJldHVybiB7XG4gICAgICBncmFtbWFyU2NvcGVzOiBKU19HUkFNTUFSUyxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgbmFtZTogJ0Zsb3cnLFxuICAgICAgZ2V0T3V0bGluZTogcHJvdmlkZXIuZ2V0T3V0bGluZS5iaW5kKHByb3ZpZGVyKSxcbiAgICB9O1xuICB9LFxuXG4gIGNyZWF0ZVR5cGVIaW50UHJvdmlkZXIoKTogT2JqZWN0IHtcbiAgICBjb25zdCB7Rmxvd1R5cGVIaW50UHJvdmlkZXJ9ID0gcmVxdWlyZSgnLi9GbG93VHlwZUhpbnRQcm92aWRlcicpO1xuICAgIGNvbnN0IGZsb3dUeXBlSGludFByb3ZpZGVyID0gbmV3IEZsb3dUeXBlSGludFByb3ZpZGVyKCk7XG4gICAgY29uc3QgdHlwZUhpbnQgPSBmbG93VHlwZUhpbnRQcm92aWRlci50eXBlSGludC5iaW5kKGZsb3dUeXBlSGludFByb3ZpZGVyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0b3I6IEdSQU1NQVJTX1NUUklORyxcbiAgICAgIHByb3ZpZGVyTmFtZTogUEFDS0FHRV9OQU1FLFxuICAgICAgaW5jbHVzaW9uUHJpb3JpdHk6IDEsXG4gICAgICB0eXBlSGludCxcbiAgICB9O1xuICB9LFxuXG4gIGRlYWN0aXZhdGUoKSB7XG4gICAgLy8gVE9ETyhtYm9saW4pOiBGaW5kIGEgd2F5IHRvIHVucmVnaXN0ZXIgdGhlIGF1dG9jb21wbGV0ZSBwcm92aWRlciBmcm9tXG4gICAgLy8gU2VydmljZUh1Yiwgb3Igc2V0IGEgYm9vbGVhbiBpbiB0aGUgYXV0b2NvbXBsZXRlIHByb3ZpZGVyIHRvIGFsd2F5cyByZXR1cm5cbiAgICAvLyBlbXB0eSByZXN1bHRzLlxuICAgIGNvbnN0IHNlcnZpY2UgPSBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdGbG93U2VydmljZScpO1xuICAgIGludmFyaWFudChzZXJ2aWNlKTtcbiAgICBzZXJ2aWNlLmRpc3Bvc2UoKTtcbiAgICBpZiAoZGlzcG9zYWJsZXMpIHtcbiAgICAgIGRpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcbiAgICAgIGRpc3Bvc2FibGVzID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGZsb3dEaWFnbm9zdGljc1Byb3ZpZGVyKSB7XG4gICAgICBmbG93RGlhZ25vc3RpY3NQcm92aWRlci5kaXNwb3NlKCk7XG4gICAgICBmbG93RGlhZ25vc3RpY3NQcm92aWRlciA9IG51bGw7XG4gICAgfVxuICB9LFxufTtcbiJdfQ==