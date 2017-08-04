'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _notEmpty = require('./notEmpty');

var _tooManyArguments = require('./tooManyArguments');

var _exists = require('./exists');

exports.default = {
  rules: {
    notEmpty: _notEmpty.notEmpty,
    tooManyArguments: _tooManyArguments.tooManyArguments,
    exists: _exists.exists
  },
  configs: {
    recommended: {
      plugins: ['require-path-exists'],
      rules: {
        'require-path-exists/notEmpty': 2,
        'require-path-exists/tooManyArguments': 2,
        'require-path-exists/exists': [2, { extensions: [
          '', '.js', '.json', '.node','.ios.js','.android.js'],
          whiteList:['RCTDeviceEventEmitter','Subscribable' ]
        }]
      },
    }
  }
};
