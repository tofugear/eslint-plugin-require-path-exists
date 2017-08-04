'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exists = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _child_process = require('child_process');

var _builtinModules = require('builtin-modules');

var _builtinModules2 = _interopRequireDefault(_builtinModules);

var _resolve = require('resolve');

var _resolve2 = _interopRequireDefault(_resolve);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getCurrentFilePath(context) {
  var filename = context.getFilename();
  if (!_fsPlus2.default.isAbsolute(filename)) {
    filename = _path2.default.join(process.cwd(), filename);
  }

  return _path2.default.dirname(filename);
}

var webpackConfigCache = {};
function getWebpackConfig(fromDir) {
  var pathname = _path2.default.resolve(fromDir);
  if (webpackConfigCache[pathname]) {
    return webpackConfigCache[pathname];
  }

  if (!_fsPlus2.default.existsSync(pathname)) {
    throw new Error('Webpack config does not exists at ' + pathname + '.');
  }

  var webpackConfigLoadCode = ['try {', '  var config = JSON.stringify(require(\'' + pathname + '\'));', '  console.log(config);', '} catch (e) {', '  console.log(\'{ "parseError": \' + JSON.stringify(e.message) + \' }\');', '}'].join('');

  var result = (0, _child_process.execFileSync)(process.argv[0], ['-e', webpackConfigLoadCode]);
  result = result.toString().trim();

  if (!result) {
    throw new Error('Webpack config is empty at ' + pathname + '.');
  }

  result = JSON.parse(result);
  if (result.parseError) {
    throw new Error('Cannot load Webpack config: ' + result.parseError);
  }

  webpackConfigCache[pathname] = result;

  return result;
}

function getWebpackAliases(webpackConfigPath) {
  var webpackConfig = getWebpackConfig(webpackConfigPath);

  var alias = {};
  if (_typeof(webpackConfig.resolve) === 'object') {
    if (_typeof(webpackConfig.resolve.alias) === 'object') {
      alias = webpackConfig.resolve.alias;
    }
  }

  return alias;
}

function testModulePath(value, fileDir) {
  var aliases = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var extensions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
  var whiteList = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

  if (whiteList.indexOf(value) >= 0) {
    return;
  }

  if (_builtinModules2.default.indexOf(value) >= 0) {
    return;
  }

  if (aliases[value] !== undefined) {
    value = aliases[value];
  } else {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(aliases)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        if (value.startsWith(key + '/')) {
          value = value.replace(key + '/', aliases[key] + '/');
          break;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  try {
    _resolve2.default.sync( resolveAbsolutePath(fileDir,value) || value, {
      basedir: fileDir,
      extensions: extensions
    });
  } catch (e) {
    return e.message;
  }
}

function resolveAbsolutePath(dir, value) {
  if (!dir || dir.length === 0 || dir === '.' || dir === '/')
    return null;

  var searchPath = _path.join(dir, 'package.json');
  if (_fsPlus.existsSync(searchPath)) {
    var config = require(searchPath);
    if (config.name && value.startsWith(config.name)) {
      var relativeTo = value.replace(new RegExp('^' + config.name), '');
      return _path.join(dir, relativeTo);
    }
  }
  return resolveAbsolutePath(_path.dirname(dir), value);
}

function testRequirePath(fileName, node, context, config) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = fileName.split('!')[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var value = _step2.value;

      var fileDir = getCurrentFilePath(context);
      if (!fileDir) {
        continue;
      }

      try {
        var result = testModulePath(value, fileDir, config.aliases, config.extensions , config.whiteList);
        if (result) {
          context.report(node, result, {});
        }
      } catch (e) {
        context.report(node, 'Unexpected error in eslint-plugin-require-path-exists: ' + e.message + '\n' + e.stack, {});
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}

var exists = exports.exists = function exists(context) {
  var pluginSettings = {};
  if (context && context.options && _typeof(context.options[0]) === 'object') {
    pluginSettings = context.options[0];
  }

  var config = {
    extensions: Array.isArray(pluginSettings.extensions) ? pluginSettings.extensions : ['', '.js', '.json', '.node'],
    webpackConfigPath: pluginSettings.webpackConfigPath === undefined ? null : pluginSettings.webpackConfigPath,
    aliases: {},
    whiteList:Array.isArray(pluginSettings.whiteList) ? pluginSettings.whiteList:['']
  };

  if (config.webpackConfigPath !== null) {
    config.aliases = getWebpackAliases(config.webpackConfigPath);
  }

  return {
    ImportDeclaration: function ImportDeclaration(node) {
      testRequirePath(node.source.value, node, context, config);
    },
    CallExpression: function CallExpression(node) {
      if (node.callee.name !== 'require' || !node.arguments.length || typeof node.arguments[0].value !== 'string' || !node.arguments[0].value) {
        return;
      }

      testRequirePath(node.arguments[0].value, node, context, config);
    }
  };
};

