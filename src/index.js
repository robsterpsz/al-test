import bluebird from 'bluebird';
import events from 'events';
import fs from 'fs';
import http from 'http';
import md5 from 'md5';
import path from 'path';
import redis  from 'redis';
import SocketIO from 'socket.io';

const eventEmitter = new events.EventEmitter();

// redis stuff
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisPort = process.env.REDIS_PORT || 6379;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisClient = redis.createClient(redisPort, redisHost);
redisClient.on('error', function (err) {
  console.error('redisClient Error:', err);
});

const hgetallAsync = (keyName) => {
  return redisClient.hgetallAsync(keyName)
  .then((data) => { return data })
  .catch((e) => { throw e });
}

const scanAsync = (cursor, pattern, returnSet) => {
  return redisClient.scanAsync(cursor, "MATCH", pattern, "COUNT", "100").then(
    (reply) => {
      cursor = reply[0];
      const keys = reply[1];
      keys.forEach((key) => { returnSet.add(key) });
      if (cursor === '0') {
        return Array.from(returnSet);
      } else {
        return scanAsync(cursor, pattern, returnSet)
      }
  }).catch((e) => { throw e });
}

const getRedisKeys = async (keyPattern) => {
  const keys = new Set();
  const redisKeys = await scanAsync('0', keyPattern, keys)
  .then((result) =>{ return result })
  .catch((e) => { throw e });
  return redisKeys;
};

const getRedisHash = async (redisKey) => {
  const redisHash = await hgetallAsync(redisKey)
    .then((hash) => { return hash })
    .catch((e) => { throw e });
  return redisHash;
};

// web server stuff
const port = process.env.PORT || 8080;
const checkMimeType = true;
const server = http.createServer((req, res) => {
  const filename = req.url == '/' ? '/index.html' : req.url;
  const ext = path.extname(filename);
  let publicPath = path.join(__dirname, '../public');
  const defaultPath = path.join(__dirname, '../public/index.html');
  const validExtensions = {
    '.css': 'text/css',
    '.gif': 'image/gif',
    '.html' : 'text/html',
    '.ico' : 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2'
  };

  let validMimeType = true;
  const mimeType = validExtensions[ext];

  if (checkMimeType) {
    validMimeType = validExtensions[ext] != undefined;
  }

  if (validMimeType) {
    publicPath += filename;
    fs.exists(publicPath, function(exists) {
      if(exists) {
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

const getFile = (localPath, res, mimeType) => {
  fs.readFile(localPath, function(err, contents) {
    if(!err) {
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
}

// Requester function
let apiIsWorking = true;
const getStocksFromApi = async (stockNames = ['AAPL','ABC','MSFT','TSLA','F']) => {

  // Checking if market is open to adjust stocks fetching frequency accordingly
  const openingHour = new Date ().getHours();
  const openingDay = new Date ().getDay();
  // TODO: check out for 'real' opening hours
  // I'm assuming market is open between 09:00 and 17:00 hours from Monday to Friday
  const marketIsOpen = openingHour > 8 && openingHour < 17 && openingDay > 0 && openingDay < 6;
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

  try {

    errorSimulation();

    const url = `http://finance.google.com/finance/info?client=ig&q=${stockNames.join(',')}`;

    const stocks = await get(url);

    // check if last response is different from current response
    const updateData = JSON.stringify(stocks);
    const refCache = md5(updateData);
    console.log('stocks requested:', refCache, stocks[0].lt_dts);

    if (stockControl.refCache !== refCache) {

      // La data debera ser guardada en Redis,
      // usando Hashes para cada stock y el timestamp (unix) para cada transaccion guardada.
      const unixTime = Math.floor(new Date() / 1000);

      stocks.forEach((stock, i) => {
        const redisData = new Array();
        const redisKey = `${unixTime}:${stockNames[i]}`;
        Object.keys(stock).forEach((key) => {
          redisData.push(key, stock[key])
        });
        redisClient.hset(redisKey, redisData);
      });


      redisClient.hset('__STOCK_CONTROL__', [
        'updateData', updateData,
        'lastUpdate', unixTime,
        'marketIsOpen', marketIsOpen,
        'refCache', refCache
      ]);

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

  } catch (e) {

    // Se debera capturar SOLAMENTE este error para los reintentos
    if (/unfortunate/.test(e)) {
      apiIsWorking = marketIsOpen ? false : true;
      refreshStockInterval(30 * 1000);
    }

    // si existe otro error (ej: se cayo el api) debera manejarse de otra manera
    // (informandole al usuario la ultima actualizacion, que no existe conexion con el api, etc).

  }
}

// promisified getter to gather (very similar to) json content from an url
const get = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      }
      if (error) {
        console.error(error.message);
        res.resume(); // consume response data to free up memory
        reject(error.message);
      }

      let rawData = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const fixedData = rawData.replace(/\/\/\s/, ''); // fix response from google API
          const parsedData = JSON.parse(fixedData);
          resolve(parsedData);
        } catch (e) {
          console.error(e.message);
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.error(`get error: ${e.message}`);
      reject(e.message);
    });
  });
}

// Timer manager requester function
let getStocksFromApiRef = null;
const refreshStockInterval = (time = 60 * 1000) => {
  console.log(`Time to getStocksFromApi set to ${time/1000} secs`);
  clearInterval(getStocksFromApiRef);
  getStocksFromApiRef = setInterval(getStocksFromApi, time);
};

// Tiny cache for stocks -> to avoid dupes basically
let stockControl = {
  updateData: null,
  lastUpdate: null,
  marketIsOpen: null,
  refCache: null
};
try {
  redisClient.hgetall('__STOCK_CONTROL__', (err, stocksData) => {
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

const errorSimulation = () => {
  // La API debera simular un 10% rate de errores usando el siguiente codigo:
  if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed')
};

server.listen(port);

console.log(`Server running at port:${port}`);

// Socket.io stuff
const io = new SocketIO(server);
io.on('connection', (socket) => {
  console.log('CONNECTION');

  // TODO: Implement some dummy data ?
  // TODO: set-up some react middleware
  // border case: empty db -> choose not to control
  socket.on('sendStockTest', () => {
    console.log('send(first)Stock ONCE');
      io.emit('newStock', stockControl);
  });
  socket.once('sendStock', () => {
    console.log('send(first)Stock ONCE');
      io.emit('newStock', stockControl);
  });

  // feed immediately when new stock arrives from Api
  eventEmitter.on('newStock', (stockControl) => {
    console.log('emitting!');
    io.emit('newStock', stockControl);
  });

  // send all data from selected stockName
  socket.on('feedStart', (stockName) => {
    (async () => {
      const keyPattern = `*:${stockName}`;
      try {
        const redisKeys = await getRedisKeys(keyPattern);
        const redisHashes = new Array();
        const redisLen = redisKeys.length > 100 ? redisKeys.length % 100 : redisKeys.length ;
        for (let i = 0; i < redisLen; i++) {
          const redisHash = await getRedisHash(redisKeys[i]);
          redisHashes.push(redisHash);
        }
        io.emit('feedSuccess', {[stockName]: redisHashes});
      } catch (e) {
        io.emit('feedError', e);
      }
    })();
  });

  socket.on('disconnect', () => {
    console.log('DISCONNECT');
  });
});
