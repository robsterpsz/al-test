'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRedisHash = exports.getRedisKeys = exports.scanAsync = exports.hgetallAsync = exports.redisClient = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_bluebird2.default.promisifyAll(_redis2.default.RedisClient.prototype);

var redisPort = process.env.REDIS_PORT || 6379;
var redisHost = process.env.REDIS_HOST || '127.0.0.1';

var redisClient = exports.redisClient = _redis2.default.createClient(redisPort, redisHost);
redisClient.on('error', function (e) {
  console.error('redisClient Error:', e);
});

var hgetallAsync = exports.hgetallAsync = function hgetallAsync(keyName) {
  return redisClient.hgetallAsync(keyName).then(function (data) {
    return data;
  }).catch(function (e) {
    throw e;
  });
};

var scanAsync = exports.scanAsync = function scanAsync(cursor, pattern, returnSet) {
  return redisClient.scanAsync(cursor, "MATCH", pattern, "COUNT", "100").then(function (reply) {
    cursor = reply[0];
    var keys = reply[1];
    keys.forEach(function (key) {
      returnSet.add(key);
    });
    if (cursor === '0') {
      return (0, _from2.default)(returnSet);
    } else {
      return scanAsync(cursor, pattern, returnSet);
    }
  }).catch(function (e) {
    throw e;
  });
};

var getRedisKeys = exports.getRedisKeys = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(keyPattern) {
    var keys, redisKeys;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            keys = new _set2.default();
            _context.next = 3;
            return scanAsync('0', keyPattern, keys).then(function (result) {
              return result;
            }).catch(function (e) {
              throw e;
            });

          case 3:
            redisKeys = _context.sent;
            return _context.abrupt('return', redisKeys);

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function getRedisKeys(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getRedisHash = exports.getRedisHash = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(redisKey) {
    var redisHash;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return hgetallAsync(redisKey).then(function (hash) {
              return hash;
            }).catch(function (e) {
              throw e;
            });

          case 2:
            redisHash = _context2.sent;
            return _context2.abrupt('return', redisHash);

          case 4:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function getRedisHash(_x2) {
    return _ref2.apply(this, arguments);
  };
}();