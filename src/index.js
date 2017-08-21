import events from 'events';
import md5 from 'md5';
import SocketIO from 'socket.io';
import { get, server } from './http.js';
import { getRedisHash, getRedisKeys, hgetallAsync, redisClient, scanAsync } from './redisCfg.js';
import { getMarketStatus, getTimeToOpen, toMoment } from './dateUtils.js';

const eventEmitter = new events.EventEmitter();
const port = process.env.PORT || 8080;
server.listen(port);
console.log(`Server running at port:${port}`);

/**
* stockControl object will help us out to deal with stocks flow
* refCache is used to avoid dupes basically
*/
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
  stockControl.apiIsWorking = false;
  stockControl.interval = null;
  stockControl.marketIsOpen = false;
  getStocksFromApi();
});

/**
* Timer manager for stocks request function
* @return an interval
*/
const refreshStockInterval = (time = 60 * 1000) => {
  console.log(`Time to getStocksFromApi set to ${time/1000} secs`);
  clearInterval(stockControl.interval);
  stockControl.interval = setInterval(getStocksFromApi, time);
};

const errorSimulation = () => {
  // La API debera simular un 10% rate de errores usando el siguiente codigo:
  if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed')
};

// Stocks request function
const getStocksFromApi = async (stockNames = ['AAPL','ABC','MSFT','TSLA','F']) => {

  stockControl.marketIsOpen = getMarketStatus();
  if (!stockControl.marketIsOpen && stockControl.apiIsWorking) {
    stockControl.apiIsWorking = false;
    eventEmitter.emit('close');
    // this would work better on a 'non-stop' enviroment: maybe not suitable for heroku free dynos
    // const timeToOpen = getTimeToOpen();
    // refreshStockInterval(timeToOpen);
    // TODO: informar la usuario que no se va a actualizar mas hasta la proxima apertura.
  } else if (stockControl.marketIsOpen && !stockControl.apiIsWorking) {
    stockControl.apiIsWorking = true;
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
      const currentUpdate = new Date();
      const unixTime = Math.floor(currentUpdate / 1000);
      const lastUpdate = stockControl.lastUpdate ? new Date(parseInt(stockControl.lastUpdate, 10) * 1000) : currentUpdate;
      const hasToBeBackedUp = lastUpdate.getMonth() !== currentUpdate.getMonth();
      const redisField = unixTime.toString();

      stocks.forEach((stock) => {

        const redisKey = `stock:${stock.id}`;
        if (hasToBeBackedUp) {
          console.log('lastUpdate:', lastUpdate);
          const isoDate = lastUpdate.toISOString().split('-');
          const backUpKey = `${isoDate[0]}${isoDate[1]}`;
          redisClient.rename(redisKey, backUpKey);
        }

        const redisKeyMeta = 'stock:keys';
        if (!stockControl[redisKeyMeta]) {
          stockControl[redisKeyMeta] = Object.keys(stock).map((key) => { return key });
          redisClient.hset('__STOCK_CONTROL__', [
            redisKeyMeta, JSON.stringify(stockControl[redisKeyMeta])
          ]);
        }

        const stockValues = Object.keys(stock).map((key) => { return stock[key] });
        redisClient.hset(redisKey, redisField, JSON.stringify(stockValues));

      });

      redisClient.hset('__STOCK_CONTROL__', [
        'lastUpdate', redisField, 'refCache', refCache, 'lastStocks', lastStocks
      ]);
      // emit new data asap
      eventEmitter.emit('newStock', {
        'lastStocks': lastStocks,
        'lastUpdate': unixTime
        // 'stocks': stocks
      });
    }

  } catch (ex) {

    // Se debera capturar SOLAMENTE este error para los reintentos
    // si existe otro error (ej: se cayo el api) debera manejarse de otra manera
    // (informandole al usuario la ultima actualizacion, que no existe conexion con el api, etc).
    if (/unfortunate/.test(ex)) {
      eventEmitter.emit('socketError', { message: 'API request failed. Retrying in 5 seconds.' });
      // this is needed for a border case: when retrying is beyond opening hours
      stockControl.apiIsWorking = stockControl.marketIsOpen ? false : true;
      refreshStockInterval(5 * 1000);
    } else {
      console.error(ex);
      eventEmitter.emit('socketError', { message: 'API connection unavailable.' });
    }

  }

}

// Socket.io stuff
const io = new SocketIO(server);
io.on('connection', (socket) => {
  console.log('CONNECTION');

  // border case: empty db -> emit socketError about no data
  socket.on('initStock', () => {
    if (stockControl.marketIsOpen) {
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
    console.log('emitting!');
    socket.emit('stock:add', newStock);
  });

  eventEmitter.on('socketError', (error) => {
    socket.emit('socketError', error);
  });

  // send all data from selected stockId
  socket.on('feedStart', (stockId) => {
    (async () => {
      try {
        const redisKey = `stock:${stockId}`;
        const redisHash = await getRedisHash(redisKey);
        // const redisKeyMeta = 'stock:keys';
        const data = { /*keys: stockControl[redisKeyMeta],*/ stocks: redisHash }
        socket.emit('feedSuccess', data, stockId);
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