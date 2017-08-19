import events from 'events';
import md5 from 'md5';
import SocketIO from 'socket.io';
import { get, server } from './http.js';
import { getRedisHash, getRedisKeys, hgetallAsync, redisClient, scanAsync } from './redisCfg.js';
import { toMoment } from './dateUtils.js';

const eventEmitter = new events.EventEmitter();
const port = process.env.PORT || 8080;
server.listen(port);
console.log(`Server running at port:${port}`);

// Stocks request function
let apiIsWorking = true;
const getStocksFromApi = async (stockNames = ['AAPL','ABC','MSFT','TSLA','F']) => {
  const marketIsOpen = getMarketStatus();
  if (!marketIsOpen && apiIsWorking) {
    apiIsWorking = false;
    eventEmitter.emit('close');
    // TODO: informar la usuario que no se va a actualizar mas hasta la proxima apertura.
  } else if (marketIsOpen && !apiIsWorking) {
    // console.log('market is opening, increasing stocks fetching frequency to 1 minute');
    apiIsWorking = true;
    refreshStockInterval();
  }
  try {
    errorSimulation();
    const url = `http://finance.google.com/finance/info?client=ig&q=${stockNames.join(',')}`;
    const stocks = await get(url);
    // check if last response is different from current response
    const lastStocks = JSON.stringify(stocks);
    const refCache = md5(lastStocks);

    if (stockControl.refCache !== refCache) {
      stockControl.refCache = refCache;
      // La data debera ser guardada en Redis,
      // usando Hashes para cada stock y el timestamp (unix) para cada transaccion guardada.
      const unixTime = Math.floor(new Date() / 1000);
      const redisField = unixTime.toString();
      stocks.forEach((stock) => {
        const redisData = new Array();
        const redisKey = stock.id;
        const stockData = JSON.stringify(stock);
        redisClient.hset(redisKey, redisField, stockData);
      });
      redisClient.hset('__STOCK_CONTROL__', [
        'lastUpdate', redisField, 'refCache', refCache, 'lastStocks', lastStocks
      ]);
      // emit new data asap
      eventEmitter.emit('newStock', {
        'lastStocks': lastStocks,
        'lastUpdate': unixTime,
        'stocks': stocks
      });
    }
  } catch (ex) {
    // Se debera capturar SOLAMENTE este error para los reintentos
    // si existe otro error (ej: se cayo el api) debera manejarse de otra manera
    // (informandole al usuario la ultima actualizacion, que no existe conexion con el api, etc).
    if (/unfortunate/.test(ex)) {
      eventEmitter.emit('socketError', { message: 'API request failed. Retrying in 30 seconds.' });
      // this is needed for a border case: when retrying is beyond opening hours
      apiIsWorking = marketIsOpen ? false : true;
      refreshStockInterval(30 * 1000);
    } else {
      eventEmitter.emit('socketError', { message: 'API connection unavailable.' });
    }
  }
}

// Return true when market is open
const getMarketStatus = () => {
  // Nasdaq opens at 09:30 and closes at 16:00 EDT from Monday to Friday
  // NYSE opens at 09:30 and closes at 16:00 ET from Monday to Friday
  const apiTimezone = toMoment(new Date(), 'America/New_York');
  const openingHour = apiTimezone.hour();
  const minutes = apiTimezone.minutes();
  const openingDay = apiTimezone.day();
  return (openingHour * 60 + minutes > 569) && (openingHour * 60 < 959)
    && openingDay > 0 && openingDay < 6;
};

// Timer manager for stocks request function
let getStocksFromApiRef = null;
const refreshStockInterval = (time = 60 * 1000) => {
  console.log(`Time to getStocksFromApi set to ${time/1000} secs`);
  clearInterval(getStocksFromApiRef);
  getStocksFromApiRef = setInterval(getStocksFromApi, time);
};

// refCache for stocks -> to avoid dupes basically
let stockControl = {
  lastStocks: null,
  lastUpdate: null,
  refCache: null
};
redisClient.hgetall('__STOCK_CONTROL__', (err, stocksData) => {
  if (err) throw new Error('Redis service error:', err);
  if (stocksData) {
    stockControl = stocksData;
  }
  // Once we are ready, we set the requesting clock and start requesting stock data asap
  refreshStockInterval();
});

const errorSimulation = () => {
  // La API debera simular un 10% rate de errores usando el siguiente codigo:
  if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed')
};

// Socket.io stuff
const io = new SocketIO(server);
io.on('connection', (socket) => {
  console.log('CONNECTION');

  // border case: empty db -> emit socketError about no data
  socket.on('initStock', () => {
    if (!getMarketStatus()) {
      if (!stockControl.lastUpdate) {
        socket.emit('socketError', { message: 'There is no available data at the moment.' });
      } else {
        console.log('send (first) Stock');
        const initStock = {
          'lastUpdate': stockControl.lastUpdate,
          'lastStocks': stockControl.lastStocks
        };
        socket.emit('stock:init', initStock);
      }
    } else {
      socket.emit('close'); // market is closed
    }
  });

  eventEmitter.on('close', () => {
    socket.emit('close');
  });

  // feed immediately when new stock arrives from Api
  eventEmitter.on('newStock', (newStock) => {
    // console.log('emitting!');
    socket.emit('stock:add', newStock);
  });

  eventEmitter.on('socketError', (error) => {
    socket.emit('socketError', error);
  });

  // send all data from selected stockId
  socket.on('feedStart', (stockId) => {
    (async () => {
      try {
        const redisHash = await getRedisHash(stockId);
        socket.emit('feedSuccess', redisHash, stockId);
      } catch (e) {
        // console.error('socketError:', e);
        socket.emit('socketError', { message: 'This service is not available at the moment.' });
      }
    })();
  });

  socket.on('disconnect', () => {
    console.log('DISCONNECT');
  });
});
