'use strict';

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

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

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eventEmitter = new _events2.default.EventEmitter();

// redis stuff
_bluebird2.default.promisifyAll(_redis2.default.RedisClient.prototype);
_bluebird2.default.promisifyAll(_redis2.default.Multi.prototype);
var redisPort = process.env.REDIS_PORT || 6379;
var redisHost = process.env.REDIS_HOST || '127.0.0.1';
var redisClient = _redis2.default.createClient(redisPort, redisHost);
redisClient.on('error', function (err) {
  console.error('redisClient Error:', err);
});

var hgetallAsync = function hgetallAsync(keyName) {
  return redisClient.hgetallAsync(keyName).then(function (data) {
    return data;
  }).catch(function (e) {
    throw e;
  });
};

var scanAsync = function scanAsync(cursor, pattern, returnSet) {
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

var getRedisKeys = function () {
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

var getRedisHash = function () {
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

// web server stuff
var port = process.env.PORT || 8080;
var checkMimeType = true;
var server = _http2.default.createServer(function (req, res) {
  var filename = req.url == '/' ? '/index.html' : req.url;
  var ext = _path2.default.extname(filename);
  var publicPath = _path2.default.join(__dirname, '../public');
  var defaultPath = _path2.default.join(__dirname, '../public/index.html');
  var validExtensions = {
    '.css': 'text/css',
    '.gif': 'image/gif',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2'
  };

  var validMimeType = true;
  var mimeType = validExtensions[ext];

  if (checkMimeType) {
    validMimeType = validExtensions[ext] != undefined;
  }

  if (validMimeType) {
    publicPath += filename;
    _fs2.default.exists(publicPath, function (exists) {
      if (exists) {
        getFile(publicPath, res, mimeType);
      } else {
        // // console.log('File not found: ' + publicPath);
        // res.writeHead(404);
        // res.end();
        res.setHeader('Location', '/');
        getFile(defaultPath, res, 'text/html');
      }
    });
  } else {
    // console.log('Invalid file extension detected: ' + ext + ' (' + filename + ')')
    res.setHeader('Location', '/');
    getFile(defaultPath, res, 'text/html');
  }
});

var getFile = function getFile(localPath, res, mimeType) {
  _fs2.default.readFile(localPath, function (err, contents) {
    if (!err) {
      res.setHeader('Content-Length', contents.length);
      if (mimeType != undefined) {
        res.setHeader('Content-Type', mimeType);
      }
      res.statusCode = 200;
      res.end(contents);
    } else {
      res.writeHead(500);
      res.end();
    }
  });
};

// Requester function
var apiIsWorking = true;
var getStocksFromApi = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
    var stockNames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ['AAPL', 'ABC', 'MSFT', 'TSLA', 'F'];
    var openingHour, openingDay, marketIsOpen, url, stocks, updateData, refCache, unixTime;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:

            // Checking if market is open to adjust stocks fetching frequency accordingly
            openingHour = new Date().getHours();
            openingDay = new Date().getDay();
            // TODO: check out for 'real' opening hours
            // I'm assuming market is open between 09:00 and 17:00 hours from Monday to Friday

            marketIsOpen = openingHour > 8 && openingHour < 17 && openingDay > 0 && openingDay < 6;

            if (!marketIsOpen && apiIsWorking) {
              // console.log('market is closed, decreasing stocks fetching frequency to 8 hours');
              apiIsWorking = false;
              // TODO: Refactor this... I'm thinking about discarding timer till next working day,
              // but I'm not sure about holidays and such, so i will keep asking every 8 hours though
              refreshStockInterval(8 * 60 * 60 * 1000);
              // TODO: informar la usuario que no se va a actualizar mas hasta la proxima apertura.
            } else if (marketIsOpen && !apiIsWorking) {
              // console.log('market is opening, increasing stocks fetching frequency to 1 minute');
              apiIsWorking = true;
              refreshStockInterval();
            }

            _context3.prev = 4;


            errorSimulation();

            url = 'http://finance.google.com/finance/info?client=ig&q=' + stockNames.join(',');
            _context3.next = 9;
            return get(url);

          case 9:
            stocks = _context3.sent;


            // check if last response is different from current response
            updateData = (0, _stringify2.default)(stocks);
            refCache = (0, _md2.default)(updateData);

            console.log('stocks requested:', refCache, stocks[0].lt_dts);

            if (stockControl.refCache !== refCache) {

              // La data debera ser guardada en Redis,
              // usando Hashes para cada stock y el timestamp (unix) para cada transaccion guardada.
              unixTime = Math.floor(new Date() / 1000);


              stocks.forEach(function (stock, i) {
                var redisData = new Array();
                var redisKey = unixTime + ':' + stockNames[i];
                (0, _keys2.default)(stock).forEach(function (key) {
                  redisData.push(key, stock[key]);
                });
                redisClient.hset(redisKey, redisData);
              });

              redisClient.hset('__STOCK_CONTROL__', ['updateData', updateData, 'lastUpdate', unixTime, 'marketIsOpen', marketIsOpen, 'refCache', refCache]);

              stockControl = {
                //'stocks': stocks,
                'updateData': updateData,
                'lastUpdate': unixTime.toString(),
                'marketIsOpen': marketIsOpen.toString(),
                'refCache': refCache
              };

              // emit new data asap
              eventEmitter.emit('newStock', stockControl);
            }

            _context3.next = 19;
            break;

          case 16:
            _context3.prev = 16;
            _context3.t0 = _context3['catch'](4);


            // Se debera capturar SOLAMENTE este error para los reintentos
            if (/unfortunate/.test(_context3.t0)) {
              apiIsWorking = marketIsOpen ? false : true;
              refreshStockInterval(30 * 1000);
            }

            // si existe otro error (ej: se cayo el api) debera manejarse de otra manera
            // (informandole al usuario la ultima actualizacion, que no existe conexion con el api, etc).

          case 19:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[4, 16]]);
  }));

  return function getStocksFromApi() {
    return _ref3.apply(this, arguments);
  };
}();

// promisified getter to gather (very similar to) json content from an url
var get = function get(url) {
  return new _promise2.default(function (resolve, reject) {
    _http2.default.get(url, function (res) {
      var statusCode = res.statusCode;


      var error = void 0;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' + ('Status Code: ' + statusCode));
      }
      if (error) {
        console.error(error.message);
        res.resume(); // consume response data to free up memory
        reject(error.message);
      }

      var rawData = '';
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        rawData += chunk;
      });
      res.on('end', function () {
        try {
          var fixedData = rawData.replace(/\/\/\s/, ''); // fix response from google API
          var parsedData = JSON.parse(fixedData);
          resolve(parsedData);
        } catch (e) {
          console.error(e.message);
          reject(e);
        }
      });
    }).on('error', function (e) {
      console.error('get error: ' + e.message);
      reject(e.message);
    });
  });
};

// Timer manager requester function
var getStocksFromApiRef = null;
var refreshStockInterval = function refreshStockInterval() {
  var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 60 * 1000;

  console.log('Time to getStocksFromApi set to ' + time / 1000 + ' secs');
  clearInterval(getStocksFromApiRef);
  getStocksFromApiRef = setInterval(getStocksFromApi, time);
};

// Tiny cache for stocks -> to avoid dupes basically
var stockControl = {
  updateData: null,
  lastUpdate: null,
  marketIsOpen: null,
  refCache: null
};
try {
  redisClient.hgetall('__STOCK_CONTROL__', function (err, stocksData) {
    if (err) throw new Error('Redis service error:', err);
    if (stocksData) {
      stockControl = stocksData;
      eventEmitter.emit('newStock', stockControl);
    }
    // Once we are ready, we set the requesting clock and start requesting stock data asap
    refreshStockInterval();
  });
} catch (e) {
  console.error(e);
}

var errorSimulation = function errorSimulation() {
  // La API debera simular un 10% rate de errores usando el siguiente codigo:
  if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed');
};

server.listen(port);

console.log('Server running at port:' + port);

// Socket.io stuff
var io = new _socket2.default(server);
io.on('connection', function (socket) {
  console.log('CONNECTION');

  // feed immediately to newcomers
  io.emit('newStock', stockControl);

  // feed immediately when new stock arrives from Api
  eventEmitter.on('newStock', function (stockControl) {
    console.log('emitting!');
    io.emit('newStock', stockControl);
  });

  // send all data from selected stockName
  socket.on('feedStart', function (stockName) {
    (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
      var keyPattern, redisKeys, redisHashes, redisLen, i, redisHash;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              keyPattern = '*:' + stockName;
              _context4.prev = 1;
              _context4.next = 4;
              return getRedisKeys(keyPattern);

            case 4:
              redisKeys = _context4.sent;
              redisHashes = new Array();
              redisLen = redisKeys.length > 100 ? redisKeys.length % 100 : redisKeys.length;
              i = 0;

            case 8:
              if (!(i < redisLen)) {
                _context4.next = 16;
                break;
              }

              _context4.next = 11;
              return getRedisHash(redisKeys[i]);

            case 11:
              redisHash = _context4.sent;

              redisHashes.push(redisHash);

            case 13:
              i++;
              _context4.next = 8;
              break;

            case 16:
              io.emit('feedSuccess', (0, _defineProperty3.default)({}, stockName, redisHashes));
              _context4.next = 22;
              break;

            case 19:
              _context4.prev = 19;
              _context4.t0 = _context4['catch'](1);

              io.emit('feedError', _context4.t0);

            case 22:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined, [[1, 19]]);
    }))();
  });

  socket.on('disconnect', function () {
    console.log('DISCONNECT');
  });
});