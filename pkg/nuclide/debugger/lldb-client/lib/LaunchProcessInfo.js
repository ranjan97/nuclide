Object.defineProperty(exports, '__esModule', {
  value: true
});

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _atom = require('../../atom');

var _LldbDebuggerInstance = require('./LldbDebuggerInstance');

var LaunchProcessInfo = (function (_DebuggerProcessInfo) {
  _inherits(LaunchProcessInfo, _DebuggerProcessInfo);

  function LaunchProcessInfo(targetUri, launchTargetInfo) {
    _classCallCheck(this, LaunchProcessInfo);

    _get(Object.getPrototypeOf(LaunchProcessInfo.prototype), 'constructor', this).call(this, 'lldb', targetUri);
    this._launchTargetInfo = launchTargetInfo;
  }

  _createClass(LaunchProcessInfo, [{
    key: 'debug',
    value: _asyncToGenerator(function* () {
      var rpcService = this._getRpcService();
      var connection = yield rpcService.launch(this._launchTargetInfo);
      rpcService.dispose();
      // Start websocket server with Chrome after launch completed.
      return new _LldbDebuggerInstance.LldbDebuggerInstance(this, connection);
    })
  }, {
    key: '_getRpcService',
    value: function _getRpcService() {
      var _require = require('../../../client');

      var getServiceByNuclideUri = _require.getServiceByNuclideUri;

      var service = getServiceByNuclideUri('LLDBDebuggerRpcService', this.getTargetUri());
      (0, _assert2['default'])(service);
      return new service.DebuggerRpcService();
    }
  }]);

  return LaunchProcessInfo;
})(_atom.DebuggerProcessInfo);

exports.LaunchProcessInfo = LaunchProcessInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkxhdW5jaFByb2Nlc3NJbmZvLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkFrQnNCLFFBQVE7Ozs7b0JBQ0ksWUFBWTs7b0NBQ1gsd0JBQXdCOztJQUU5QyxpQkFBaUI7WUFBakIsaUJBQWlCOztBQUdqQixXQUhBLGlCQUFpQixDQUdoQixTQUFxQixFQUFFLGdCQUFrQyxFQUFFOzBCQUg1RCxpQkFBaUI7O0FBSTFCLCtCQUpTLGlCQUFpQiw2Q0FJcEIsTUFBTSxFQUFFLFNBQVMsRUFBRTtBQUN6QixRQUFJLENBQUMsaUJBQWlCLEdBQUcsZ0JBQWdCLENBQUM7R0FDM0M7O2VBTlUsaUJBQWlCOzs2QkFRakIsYUFBOEI7QUFDdkMsVUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pDLFVBQU0sVUFBVSxHQUFHLE1BQU0sVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNuRSxnQkFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUVyQixhQUFPLCtDQUF5QixJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDbkQ7OztXQUVhLDBCQUEyQjtxQkFDTixPQUFPLENBQUMsaUJBQWlCLENBQUM7O1VBQXBELHNCQUFzQixZQUF0QixzQkFBc0I7O0FBQzdCLFVBQU0sT0FBTyxHQUFHLHNCQUFzQixDQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ3RGLCtCQUFVLE9BQU8sQ0FBQyxDQUFDO0FBQ25CLGFBQU8sSUFBSSxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztLQUN6Qzs7O1NBckJVLGlCQUFpQiIsImZpbGUiOiJMYXVuY2hQcm9jZXNzSW5mby5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtEZWJ1Z2dlckluc3RhbmNlfSBmcm9tICcuLi8uLi9hdG9tJztcbmltcG9ydCB0eXBlIHtOdWNsaWRlVXJpfSBmcm9tICcuLi8uLi8uLi9yZW1vdGUtdXJpJztcbmltcG9ydCB0eXBlIHtcbiAgTGF1bmNoVGFyZ2V0SW5mbyxcbiAgRGVidWdnZXJScGNTZXJ2aWNlIGFzIERlYnVnZ2VyUnBjU2VydmljZVR5cGUsXG59IGZyb20gJy4uLy4uL2xsZGItc2VydmVyL2xpYi9EZWJ1Z2dlclJwY1NlcnZpY2VJbnRlcmZhY2UnO1xuXG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge0RlYnVnZ2VyUHJvY2Vzc0luZm99IGZyb20gJy4uLy4uL2F0b20nO1xuaW1wb3J0IHtMbGRiRGVidWdnZXJJbnN0YW5jZX0gZnJvbSAnLi9MbGRiRGVidWdnZXJJbnN0YW5jZSc7XG5cbmV4cG9ydCBjbGFzcyBMYXVuY2hQcm9jZXNzSW5mbyBleHRlbmRzIERlYnVnZ2VyUHJvY2Vzc0luZm8ge1xuICBfbGF1bmNoVGFyZ2V0SW5mbzogTGF1bmNoVGFyZ2V0SW5mbztcblxuICBjb25zdHJ1Y3Rvcih0YXJnZXRVcmk6IE51Y2xpZGVVcmksIGxhdW5jaFRhcmdldEluZm86IExhdW5jaFRhcmdldEluZm8pIHtcbiAgICBzdXBlcignbGxkYicsIHRhcmdldFVyaSk7XG4gICAgdGhpcy5fbGF1bmNoVGFyZ2V0SW5mbyA9IGxhdW5jaFRhcmdldEluZm87XG4gIH1cblxuICBhc3luYyBkZWJ1ZygpOiBQcm9taXNlPERlYnVnZ2VySW5zdGFuY2U+IHtcbiAgICBjb25zdCBycGNTZXJ2aWNlID0gdGhpcy5fZ2V0UnBjU2VydmljZSgpO1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBycGNTZXJ2aWNlLmxhdW5jaCh0aGlzLl9sYXVuY2hUYXJnZXRJbmZvKTtcbiAgICBycGNTZXJ2aWNlLmRpc3Bvc2UoKTtcbiAgICAvLyBTdGFydCB3ZWJzb2NrZXQgc2VydmVyIHdpdGggQ2hyb21lIGFmdGVyIGxhdW5jaCBjb21wbGV0ZWQuXG4gICAgcmV0dXJuIG5ldyBMbGRiRGVidWdnZXJJbnN0YW5jZSh0aGlzLCBjb25uZWN0aW9uKTtcbiAgfVxuXG4gIF9nZXRScGNTZXJ2aWNlKCk6IERlYnVnZ2VyUnBjU2VydmljZVR5cGUge1xuICAgIGNvbnN0IHtnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpfSA9IHJlcXVpcmUoJy4uLy4uLy4uL2NsaWVudCcpO1xuICAgIGNvbnN0IHNlcnZpY2UgPSBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdMTERCRGVidWdnZXJScGNTZXJ2aWNlJywgdGhpcy5nZXRUYXJnZXRVcmkoKSk7XG4gICAgaW52YXJpYW50KHNlcnZpY2UpO1xuICAgIHJldHVybiBuZXcgc2VydmljZS5EZWJ1Z2dlclJwY1NlcnZpY2UoKTtcbiAgfVxufVxuIl19