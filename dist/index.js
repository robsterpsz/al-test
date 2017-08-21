'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _http = require('./http.js');

var _redisCfg = require('./redisCfg.js');

var _dateUtils = require('./dateUtils.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eventEmitter = new _events2.default.EventEmitter();
var port = process.env.PORT || 8080;
_http.server.listen(port);
console.log('Server running at port:' + port);

/**
* stockControl object will help us out to deal with stocks flow
* refCache is used to avoid dupes basically
*/
var stockControl = {
  lastStocks: null,
  lastUpdate: null,
  refCache: null
};
_redisCfg.redisClient.hgetall('__STOCK_CONTROL__', function (err, stocksData) {
  if (err) throw new Error('Redis service error:', err);
  if (stocksData) {
    stockControl = stocksData;
  }
  // Once we are ready, we set the requesting clock and start requesting stock data asap
  stockControl.apiIsWorking = false;
  stockControl.interval = null;
  stockControl.marketIsOpen = false;
  getStocksFromApi();
});

/**
* Timer manager for stocks request function
* @return an interval
*/
var refreshStockInterval = function refreshStockInterval() {
  var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 60 * 1000;

  console.log('Time to getStocksFromApi set to ' + time / 1000 + ' secs');
  clearInterval(stockControl.interval);
  stockControl.interval = setInterval(getStocksFromApi, time);
};

var errorSimulation = function errorSimulation() {
  // La API debera simular un 10% rate de errores usando el siguiente codigo:
  if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed');
};

// Stocks request function
var getStocksFromApi = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    var stockNames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ['AAPL', 'ABC', 'MSFT', 'TSLA', 'F'];
    var url, stocks, lastStocks, refCache, currentUpdate, unixTime, lastUpdate, hasToBeBackedUp, redisField;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            stockControl.marketIsOpen = (0, _dateUtils.getMarketStatus)();
            if (!stockControl.marketIsOpen && stockControl.apiIsWorking) {
              stockControl.apiIsWorking = false;
              eventEmitter.emit('stock:close');
              // this would work better on a 'non-stop' enviroment: maybe not suitable for heroku free dynos
              // const timeToOpen = getTimeToOpen();
              // refreshStockInterval(timeToOpen);
              // TODO: informar la usuario que no se va a actualizar mas hasta la proxima apertura.
            } else if (stockControl.marketIsOpen && !stockControl.apiIsWorking) {
              stockControl.apiIsWorking = true;
              refreshStockInterval();
            }

            _context.prev = 2;


            errorSimulation();

            url = 'http://finance.google.com/finance/info?client=ig&q=' + stockNames.join(',');
            _context.next = 7;
            return (0, _http.get)(url);

          case 7:
            stocks = _context.sent;

            // check if last response is different from current response
            lastStocks = (0, _stringify2.default)(stocks);
            refCache = (0, _md2.default)(lastStocks);


            if (stockControl.refCache !== refCache) {
              stockControl.refCache = refCache;
              // La data debera ser guardada en Redis,
              // usando Hashes para cada stock y el timestamp (unix) para cada transaccion guardada.
              currentUpdate = new Date();
              unixTime = Math.floor(currentUpdate / 1000);
              lastUpdate = stockControl.lastUpdate ? new Date(parseInt(stockControl.lastUpdate, 10) * 1000) : currentUpdate;
              hasToBeBackedUp = lastUpdate.getMonth() !== currentUpdate.getMonth();
              redisField = unixTime.toString();


              stocks.forEach(function (stock) {

                var redisKey = 'stock:' + stock.id;
                if (hasToBeBackedUp) {
                  var isoDate = lastUpdate.toISOString().split('-');
                  var backUpKey = '' + isoDate[0] + isoDate[1];
                  _redisCfg.redisClient.rename(redisKey, backUpKey);
                }

                var stockValues = (0, _keys2.default)(stock).map(function (key) {
                  return stock[key];
                });
                _redisCfg.redisClient.hset(redisKey, redisField, (0, _stringify2.default)(stockValues));
              });

              _redisCfg.redisClient.hset('__STOCK_CONTROL__', ['lastUpdate', redisField, 'refCache', refCache, 'lastStocks', lastStocks]);
              // emit new data asap
              eventEmitter.emit('stock:add', {
                'lastStocks': lastStocks,
                'lastUpdate': unixTime
              });
            }

            _context.next = 16;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context['catch'](2);


            // Se debera capturar SOLAMENTE este error para los reintentos
            // si existe otro error (ej: se cayo el api) debera manejarse de otra manera
            // (informandole al usuario la ultima actualizacion, que no existe conexion con el api, etc).
            if (/unfortunate/.test(_context.t0)) {
              eventEmitter.emit('stock:error', { message: 'API request failed. Retrying in 5 seconds.' });
              // this is needed for a border case: when retrying is beyond opening hours
              stockControl.apiIsWorking = stockControl.marketIsOpen ? false : true;
              refreshStockInterval(5 * 1000);
            } else {
              console.error(_context.t0);
              eventEmitter.emit('stock:error', { message: 'API connection unavailable.' });
            }

          case 16:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[2, 13]]);
  }));

  return function getStocksFromApi() {
    return _ref.apply(this, arguments);
  };
}();

// Socket.io stuff
var io = new _socket2.default(_http.server);
io.on('connection', function (socket) {
  console.log('CONNECTION');

  // border case: empty db -> emit socketError about no data
  socket.on('stock:init', function () {
    if (stockControl.marketIsOpen) {
      if (!stockControl.lastUpdate) {
        socket.emit('stock:error', { message: 'There is no available data at the moment.' });
      } else {
        console.log('send (first) Stock');
        var initStock = {
          'lastUpdate': stockControl.lastUpdate,
          'lastStocks': stockControl.lastStocks
        };
        socket.emit('stock:init', initStock);
      }
    } else {
      socket.emit('stock:close'); // market is closed
    }
  });

  eventEmitter.on('stock:close', function () {
    socket.emit('stock:close');
  });

  // feed immediately when new stock arrives from Api
  eventEmitter.on('stock:add', function (newStock) {
    console.log('emitting!');
    socket.emit('stock:add', newStock);
  });

  eventEmitter.on('stock:error', function (error) {
    socket.emit('stock:error', error);
  });

  // send all data from selected stockId
  socket.on('stock:feedStart', function (stockId) {
    (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
      var redisKey, redisHash, data;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              redisKey = 'stock:' + stockId;
              _context2.next = 4;
              return (0, _redisCfg.getRedisHash)(redisKey);

            case 4:
              redisHash = _context2.sent;
              data = { stocks: redisHash };

              socket.emit('stock:feedSuccess', data, stockId);
              _context2.next = 12;
              break;

            case 9:
              _context2.prev = 9;
              _context2.t0 = _context2['catch'](0);

              // console.error('socketError:', e);
              socket.emit('stock:error', { message: 'This service is not available at the moment.' });

            case 12:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined, [[0, 9]]);
    }))();
  });

  socket.on('disconnect', function () {
    console.log('DISCONNECT');
  });
});