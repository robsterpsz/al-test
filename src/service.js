import md5 from 'md5';
import { eventEmitter } from './index.js';
import { get } from './http.js';
import { getMarketStatus } from './dateUtils.js';
import { getRedisKeys, redisClient } from './redis.js';

/**
* sc object controls stock data flow
*/
export const sc = {
  addStockCacheKeys(stockId, key) {
    if (sc.stockCacheKeys && sc.stockCacheKeys[stockId]) {
      sc.stockCacheKeys[stockId].push(key);
    } else {
      sc.stockCacheKeys[stockId] = [key];
    }
    return sc.lastStockCacheKey = key;
  },
  errorSimulation() {
    // La API debera simular un 10% rate de errores usando el siguiente codigo:
    if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed');
  },
  async getStockCacheKeys (stockId) {
    const keys = sc.stockCacheKeys && sc.stockCacheKeys[stockId]
      && sc.stockCacheKeys[stockId].length > 0;
    let result = null;
    if (!keys) {
      const cacheKeys = await getRedisKeys(`stock:${stockId}:*`);
      sc.stockCacheKeys[stockId] = cacheKeys.sort();
      result = sc.stockCacheKeys[stockId];
    } else {
      result = sc.stockCacheKeys[stockId];
    }
    return result;
  },
  getStockPreCache (cacheSync) {
    return sc.preCache[cacheSync.stockId].filter((data) => {
      return parseInt(data[0], 10) > cacheSync.lastUpdate;
    });
  },
  init: async () => {
    redisClient.hgetall('__STOCK_CONTROL__', (err, stocksData) => {
      if (err) throw new Error('Redis service error:', err);
      if (stocksData) {
        sc.dupeControl = stocksData.dupeControl;
        sc.lastUpdate = parseInt(stocksData.lastUpdate, 10);
        sc.stocks = JSON.parse(stocksData.stocks);
      }
    });
    const keys = await sc.getStockCacheKeys('*');
    keys.forEach((key) => {
      const stockId = key.split(':')[1];
      sc.preCache[stockId] = [];
    });
    return getStocksFromApi();
  },
  refreshStockInterval (time = 60 * 1000, fn = getStocksFromApi) {
    clearInterval(this.stockInterval);
    this.stockInterval = setInterval(fn, time);
    console.log(`Time to getStocksFromApi set to ${time/1000} secs`);
  },
  apiIsWorking: false,      // needed to set interval time to default (60 seconds) after sim error
  dupeControl: null,        // to avoid dupes on incoming data
  lastStockCacheKey: null,  // cheaper comparison param to perform feeding
  lastUpdate: null,         // used as comparer param and ref name in redis keys
  market: {},               // when market is closed client is not served at all
  preCache: {},             // used to save traffic quota on free redis cloud services
  stockCacheKeys: {},       // memoizing redis keys for each stock to emit cached data
  stockInterval: null,      // request stock data every 60 secs or 5 secs when retrying
  stocks: {}                // just the very last stock data, to be emitted as it arrives
};

/**
* getStocksFromApi requests stocks data, then saves and emits
* @param stockNames {Array} Contains a list of stock names
* @return true
*/
const getStocksFromApi = async (stockNames = ['AAPL','ABC','MSFT','TSLA','F']) => {

  sc.market = getMarketStatus();

  if (!sc.market.isOpen && sc.apiIsWorking) {

    sc.apiIsWorking = false;
    eventEmitter.emit('stock:close', sc.market);

    // this would work better on a 'non-stop' enviroment: not suitable with heroku free dyno
    // const timeToOpen = getTimeToOpen();
    // refreshStockInterval(timeToOpen);
    // TODO: informar la usuario que no se va a actualizar mas hasta la proxima apertura.

  } else if (sc.market.isOpen && !sc.apiIsWorking) {

    sc.apiIsWorking = true;
    sc.refreshStockInterval();

  }

  try {

    sc.errorSimulation();

    const url = `http://finance.google.com/finance/info?client=ig&q=${stockNames.join(',')}`;
    const rawStocks = await get(url);

    // check if last response is different from current response
    // const lastStocks = JSON.stringify(rawStocks);
    const dupeControl = md5(JSON.stringify(rawStocks));

    if (sc.dupeControl !== dupeControl) {
      sc.dupeControl = dupeControl;

      // La data debera ser guardada en Redis,
      // usando Hashes para cada stock y el timestamp (unix) para cada transaccion guardada.

      let hasToBeArchived = false;
      const currentUpdate = new Date();
      if (sc.lastUpdate) {
        const lastUpdateDate = new Date(sc.lastUpdate * 1000);
        hasToBeArchived = lastUpdateDate.getDate() !== currentUpdate.getDate();
      }

      const unixTime = Math.floor(currentUpdate / 1000);
      const lastUpdate = unixTime.toString();

      rawStocks.forEach((stock) => {

        const redisKey = `stock:${stock.id}`;

        if (hasToBeArchived) {
          sc.preCache[stock.id] = [];
          const archiveKey = `stock:${stock.id}:${sc.lastUpdate}`;
          sc.addStockCacheKeys(stock.id, archiveKey);
          redisClient.rename(redisKey, archiveKey);
        }

        const stockValues = Object.keys(stock).map((key) => {
          const value = key === 'id' ? lastUpdate : stock[key];
          return value;
        });

        redisClient.hset(redisKey, lastUpdate, JSON.stringify(stockValues));

        sc.stocks[stock.id] = [stockValues];

        if (sc.preCache && sc.preCache[stock.id]) {
          sc.preCache[stock.id].push(stockValues);
        } else {
          sc.preCache[stock.id] = [stockValues];
        }

      });

      redisClient.hset('__STOCK_CONTROL__', [
        'dupeControl', dupeControl,
        'lastUpdate', lastUpdate,
        'stocks', JSON.stringify(sc.stocks)
      ]);

      sc.lastUpdate = unixTime;

      // emit new data
      eventEmitter.emit('stock:add', {
        'lastUpdate': unixTime,
        'stocks': sc.stocks
      });
    }

    return true;

  } catch (ex) {

    // Se debera capturar SOLAMENTE este error para los reintentos
    // si existe otro error (ej: se cayo el api) debera manejarse de otra manera
    // (informandole al usuario la ultima actualizacion, que no existe conexion con el api, etc).

    if (/unfortunate/.test(ex)) {

      // this was needed for a border case: when retrying was beyond opening hours
      // and we still wanted to keep serving data
      sc.apiIsWorking = sc.market.isOpen ? false : true;
      const retryMs = 30;
      sc.refreshStockInterval(retryMs * 1000);

      eventEmitter.emit('stock:error', {
        active: true,
        message: `API request error simulation: retrying in ${retryMs} seconds.`,
        value: retryMs
      });

    } else {

      console.error(ex);
      eventEmitter.emit('stock:error', { message: 'API connection unavailable.' });

    }
  }
};
