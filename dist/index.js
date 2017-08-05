'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// redis stuff
var redisPort = process.env.REDIS_PORT || 6379;
var redisHost = process.env.REDIS_HOST || '127.0.0.1';
var redisClient = _redis2.default.createClient(redisPort, redisHost);
redisClient.on("error", function (err) {
  console.log("redisClient Error:", err);
});

var port = process.env.PORT || 3000;

var server = _http2.default.createServer(function (req, res) {
  var ip = req.socket.remoteAddress;
  var port = req.socket.remotePort;
  console.log('Your IP address is ' + ip + ' and your source port is ' + port + '.');

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!\n');
});

server.on('connect', function (err, socket) {
  console.log('connect');
});

server.on('connection', function (err, socket) {
  console.log('socket', socket);
  console.log('connection');
});

// promise to gather (very similar to) json content from an url
var get = function get(url) {
  return new _promise2.default(function (resolve, reject) {
    _http2.default.get(url, function (res) {
      var statusCode = res.statusCode;

      var contentType = res.headers['content-type'];

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

// Timer manager for requesting data
// By default we will request stock data from Google API every 1 minute
// 'Ref' suffix is an implicit self-convention to link names between a var name and its target function
// kind of a trick to avoid any uncontrolled timer
var getStocksFromApiRef = null;
var intervalProvider = function intervalProvider() {
  var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 60 * 1000;
  var fn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getStocksFromApi;

  console.log('Requesting time set to: ' + time + ' ms for: ' + fn.name);
  clearInterval(fn.name + 'Ref');
  setInterval(fn, time);
};

// Tiny cache for stocks -> to avoid dupes basically
var stocksRefCache = null;
redisClient.hget('__STOCK_CONTROL__', 'REF_CACHE', function (err, refCache) {
  if (err) console.error('Redis error:', err);
  stocksRefCache = refCache;
  console.log('stocksRefCache:', stocksRefCache);
  // Once we are ready, we set the requesting clock and start requesting stock data asap
  getStocksFromApiRef = intervalProvider();
  getStocksFromApi();
});

var errorSimulation = function errorSimulation() {
  // La API debera simular un 10% rate de errores usando el siguiente codigo:
  if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed');
};

var apiIsWorking = true;
var getStocksFromApi = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    var stockNames = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ['AAPL', 'ABC', 'MSFT', 'TSLA', 'F'];
    var openingHour, openingDay, marketIsOpen, url, stocks, hashedStocks, unixTime;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            // Checking if market is open to adjust stocks fetching frequency accordingly
            openingHour = new Date().getHours();
            openingDay = new Date().getDay();
            // TODO: check out for 'real' opening hours
            // I'm assuming market is open between 07:00 and 18:00 hours from Monday to Friday

            marketIsOpen = openingHour > 6 && openingHour < 18 && openingDay > 0 && openingDay < 6;

            if (!marketIsOpen && apiIsWorking) {
              console.log('market is closed, decreasing stocks fetching frequency to 8 hours');
              apiIsWorking = false;
              // TODO: Refactor this... I'm thinking about discarding timer till next working day,
              // but I'm not sure about holidays and such, so i will keep asking every 8 hours though
              intervalProvider(8 * 60 * 60 * 1000);
              // TODO: informar la usuario que no se va a actualizar mas hasta la proxima apertura.
            } else if (marketIsOpen && !apiIsWorking) {
              console.log('market is opening, increasing stocks fetching frequency to 1 minute');
              apiIsWorking = true;
              intervalProvider();
            }

            _context.prev = 4;

            errorSimulation();
            url = 'http://finance.google.com/finance/info?client=ig&q=' + stockNames.join(',');
            _context.next = 9;
            return get(url);

          case 9:
            stocks = _context.sent;

            // check if last response is different from current response
            hashedStocks = (0, _md2.default)(stocks);

            console.log('stocks requested:', hashedStocks);
            if (stocksRefCache !== hashedStocks) {
              stocksRefCache = hashedStocks;
              // La data debera ser guardada en Redis,
              // usando Hashes para cada stock y el timestamp (unix) para cada transaccion guardada.
              unixTime = Math.floor(new Date() / 1000);

              stocks.forEach(function (stock, i) {
                var redisData = new Array();
                var redisKey = unixTime + ':' + stockNames[i];
                (0, _keys2.default)(stock).forEach(function (key) {
                  redisData.push(key, stock[key]);
                });
                console.log(redisKey);
                redisClient.hset(redisKey, redisData);
              });
              redisClient.hset('__STOCK_CONTROL__', 'REF_CACHE', hashedStocks);
              console.log('__STOCK_CONTROL__', 'CACHE_REF', hashedStocks);
              // TODO: informar al usuario la ultima actualizacion
              redisClient.hset('__STOCK_CONTROL__', 'LAST_UPDATE', unixTime);
              console.log('__STOCK_CONTROL__', 'LAST_UPDATE', unixTime);
            }
            _context.next = 18;
            break;

          case 15:
            _context.prev = 15;
            _context.t0 = _context['catch'](4);

            // Se debera capturar SOLAMENTE este error para los reintentos
            if (/unfortunate/.test(_context.t0)) {
              console.log('Simulated Error: Retrying in 30 seconds...');
              apiIsWorking = marketIsOpen ? false : true;
              intervalProvider(30 * 1000);
            }
            // si existe otro error (ej: se cayo el api) debera manejarse de otra manera
            // (informandole al usuario la ultima actualizacion, que no existe conexion con el api, etc).

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[4, 15]]);
  }));

  return function getStocksFromApi() {
    return _ref.apply(this, arguments);
  };
}();

server.listen(port);

console.log('Server running at port:' + port);