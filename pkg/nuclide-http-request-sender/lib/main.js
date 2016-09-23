'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import xfetch from '../../commons-node/xfetch';
import {CompositeDisposable} from 'atom';
import createPackage from '../../commons-atom/createPackage';

class Activation {
  _disposables: CompositeDisposable;

  constructor(): void {
    this._disposables = new CompositeDisposable(
      atom.commands.add('atom-workspace', {
        'nuclide-http-request-sender:send-http-request': () => {
          xfetch('facebook.com', {});
        },
      }),
    );
  }

  dispose(): void {
    this._disposables.dispose();
  }
}

export default createPackage(Activation);