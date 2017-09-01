import events from 'events';
import SocketIO from 'socket.io';
import { getRedisHash } from './redis.js';
import { server } from './http.js';
import { getMarketStatus } from './dateUtils.js';
import { sc } from './service.js';


/**
 * Node.js EventEmitter instance
 * @see https://nodejs.org/dist/latest-v6.x/docs/api/events.html#events_class_eventemitter
 */
export const eventEmitter = new events.EventEmitter();

/**
 * Port is defined internally by Heroku at production
 * @type {number} 8080 by default at development
 */
const port = process.env.PORT || 8080;
server.listen(port);

console.log(`Server running at port:${port}`);


// start service
sc.init();

/**
 * Socket.io server
 * @type {Object}
 * @see https://socket.io/docs/server-api/
 */
const io = new SocketIO(server);
io.on('connection', (socket) => {

  console.log('CONNECTION');
  console.log('market:', sc.market);

  if (!sc.market.isOpen) {
    sc.market = getMarketStatus();
    socket.emit('stock:close', sc.market);
  }

  eventEmitter.on('stock:close', (market) => {
    socket.emit('stock:close', market);
  });

  // feed immediately when new stock arrives from service Api
  eventEmitter.on('stock:add', (data) => {
    socket.emit('stock:add', data);
  });

  // or feed on request to new comers
  socket.on('stock:add', () => {
    if (!sc.lastUpdate) {
      socket.emit('stock:error', { message: 'There is no available data at the moment.' });
    } else {
      const data = {
        'lastUpdate': sc.lastUpdate,
        'stocks': sc.stocks
      };
      socket.emit('stock:add', data);
    }
  });

  eventEmitter.on('stock:error', (error) => {
    socket.emit('stock:error', error);
  });

  // send init data
  socket.on('stock:init', () => {

    // border case: empty db -> emit socketError about no data
    if (!sc.lastUpdate) {

      socket.emit('stock:error', { message: 'There is no available data at the moment.' });

    } else {

      const initStock = {
        'lastUpdate': sc.lastUpdate,
        'stockCache': sc.stocks,
        'stocks': sc.stocks
      };

      socket.emit('stock:init', initStock, sc.market);
      console.log('send init Stock');

    }
  });

  // send all data from selected stockId
  socket.on('stock:feedStart', (cacheSync) => {
    (async () => {

      const feedCache = async (redisKey) => {
        const redisHash = await getRedisHash(redisKey);
        const data = { stocks: redisHash };
        if (redisHash.length === 0) {
          socket.emit('stock:error', { message: 'There is no available data at the moment.' });
        } else {
          socket.emit('stock:feedCache', data, cacheSync);
        }
      };

      const feedEnd = async () => {
        console.log('feedEnd');
        const data = await sc.getStockPreCache(cacheSync);
        if (data.length === 0) {
          socket.emit('stock:error', { message: 'There is no more available data at the moment.' });
        } else {
          socket.emit('stock:feedEnd', data, cacheSync);
        }
      };

      try {

        // send today data or archived data as needed
        let redisKey = null;

        if (!cacheSync.lastUpdate) {
          // no cached data on client, we emit a queue with the next updates
          cacheSync.next = await sc.getStockCacheKeys(cacheSync.stockId);
        }

        // next queue shrinks with each emit to be cached by the client
        redisKey = cacheSync.next.shift();

        if (redisKey) {
          feedCache(redisKey);

        } else {

          // when queue is already empty we still need to do one more check
          // lets say client visit us on monday and tuesday and then comes back on friday...
          // first, let's check that at least one day has passed
          if (Math.abs(cacheSync.lastUpdate - sc.lastUpdate) >= 24 * 60 * 60) {

            const lastStockCacheKey = `stock:${cacheSync.stockId}:${cacheSync.lastUpdate}`;
            const cacheKeys = await sc.getStockCacheKeys(cacheSync.stockId);
            const lastCacheKey = cacheKeys.reverse()[0];

            if (lastStockCacheKey !== lastCacheKey) {

              // client has some cached data but needs some more
              cacheSync.next = cacheKeys.slice(cacheKeys.indexOf(lastStockCacheKey) + 1);
              redisKey = cacheSync.next.shift();
              feedCache(redisKey);

            } else {

              // one or more days has passed but cache is up to date
              feedEnd();

            }

          } else {

            // ok, client is pretty much up to date
            // so, we will emit just the last bits of pre cached data
            feedEnd();

          }

        }

      } catch (e) {
        console.error('socketError:', e);
        socket.emit('stock:error', { message: 'This service is not available at the moment.' });
      }
    })();
  });

  socket.on('disconnect', () => {
    console.log('DISCONNECT');
  });
});
