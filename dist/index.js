'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

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

// Stocks request function
var apiIsWorking = true;
var getStocksFromApi = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    var stockNames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ['AAPL', 'ABC', 'MSFT', 'TSLA', 'F'];
    var marketIsOpen, url, stocks, lastStocks, refCache, unixTime, redisField;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            marketIsOpen = getMarketStatus();

            if (!marketIsOpen && apiIsWorking) {
              apiIsWorking = false;
              eventEmitter.emit('close');
              // TODO: informar la usuario que no se va a actualizar mas hasta la proxima apertura.
            } else if (marketIsOpen && !apiIsWorking) {
              // console.log('market is opening, increasing stocks fetching frequency to 1 minute');
              apiIsWorking = true;
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
              unixTime = Math.floor(new Date() / 1000);
              redisField = unixTime.toString();

              stocks.forEach(function (stock) {
                var redisData = new Array();
                var redisKey = stock.id;
                var stockData = (0, _stringify2.default)(stock);
                _redisCfg.redisClient.hset(redisKey, redisField, stockData);
              });
              _redisCfg.redisClient.hset('__STOCK_CONTROL__', ['lastUpdate', redisField, 'refCache', refCache, 'lastStocks', lastStocks]);
              // emit new data asap
              eventEmitter.emit('newStock', {
                'lastStocks': lastStocks,
                'lastUpdate': unixTime,
                'stocks': stocks
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
              eventEmitter.emit('socketError', { message: 'API request failed. Retrying in 30 seconds.' });
              // this is needed for a border case: when retrying is beyond opening hours
              apiIsWorking = marketIsOpen ? false : true;
              refreshStockInterval(30 * 1000);
            } else {
              eventEmitter.emit('socketError', { message: 'API connection unavailable.' });
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

// Return true when market is open
var getMarketStatus = function getMarketStatus() {
  // Nasdaq opens at 09:30 and closes at 16:00 EDT from Monday to Friday
  // NYSE opens at 09:30 and closes at 16:00 ET from Monday to Friday
  var apiTimezone = (0, _dateUtils.toMoment)(new Date(), 'America/New_York');
  var openingHour = apiTimezone.hour();
  var minutes = apiTimezone.minutes();
  var openingDay = apiTimezone.day();
  return openingHour * 60 + minutes > 569 && openingHour * 60 < 959 && openingDay > 0 && openingDay < 6;
};

// Timer manager for stocks request function
var getStocksFromApiRef = null;
var refreshStockInterval = function refreshStockInterval() {
  var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 60 * 1000;

  console.log('Time to getStocksFromApi set to ' + time / 1000 + ' secs');
  clearInterval(getStocksFromApiRef);
  getStocksFromApiRef = setInterval(getStocksFromApi, time);
};

// refCache for stocks -> to avoid dupes basically
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
  refreshStockInterval();
});

var errorSimulation = function errorSimulation() {
  // La API debera simular un 10% rate de errores usando el siguiente codigo:
  if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed');
};

// Socket.io stuff
var io = new _socket2.default(_http.server);
io.on('connection', function (socket) {
  console.log('CONNECTION');

  // border case: empty db -> emit socketError about no data
  socket.on('initStock', function () {
    if (!getMarketStatus()) {
      if (!stockControl.lastUpdate) {
        socket.emit('socketError', { message: 'There is no available data at the moment.' });
      } else {
        console.log('send (first) Stock');
        var initStock = {
          'lastUpdate': stockControl.lastUpdate,
          'lastStocks': stockControl.lastStocks
        };
        socket.emit('stock:init', initStock);
      }
    } else {
      socket.emit('close'); // market is closed
    }
  });

  eventEmitter.on('close', function () {
    socket.emit('close');
  });

  // feed immediately when new stock arrives from Api
  eventEmitter.on('newStock', function (newStock) {
    // console.log('emitting!');
    socket.emit('stock:add', newStock);
  });

  eventEmitter.on('socketError', function (error) {
    socket.emit('socketError', error);
  });

  // send all data from selected stockId
  socket.on('feedStart', function (stockId) {
    (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
      var redisHash;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return (0, _redisCfg.getRedisHash)(stockId);

            case 3:
              redisHash = _context2.sent;

              socket.emit('feedSuccess', redisHash, stockId);
              _context2.next = 10;
              break;

            case 7:
              _context2.prev = 7;
              _context2.t0 = _context2['catch'](0);

              // console.error('socketError:', e);
              socket.emit('socketError', { message: 'This service is not available at the moment.' });

            case 10:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined, [[0, 7]]);
    }))();
  });

  socket.on('disconnect', function () {
    console.log('DISCONNECT');
  });
});