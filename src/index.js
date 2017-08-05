import http from 'http';
import md5 from 'md5';
import redis  from 'redis';

// redis stuff
const redisPort = process.env.REDIS_PORT || 6379;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisClient = redis.createClient(redisPort, redisHost);
redisClient.on("error", function (err) {
    console.log("redisClient Error:", err);
});

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  console.log(`Your IP address is ${ip} and your source port is ${port}.`);

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World!\n');
});

server.on('connect', (err, socket) => {
  console.log('connect')
});

server.on('connection', (err, socket) => {
  console.log('socket', socket)
  console.log('connection')
});


// promise to gather (very similar to) json content from an url
const get = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

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

// Timer manager for requesting data
// By default we will request stock data from Google API every 1 minute
// 'Ref' suffix is an implicit self-convention to link names between a var name and its target function
// kind of a trick to avoid any uncontrolled timer
let getStocksFromApiRef = null;
const intervalProvider = (time = 60 * 1000, fn = getStocksFromApi) => {
  console.log(`Requesting time set to: ${time} ms for: ${fn.name}`);
  clearInterval(`${fn.name}Ref`);
  setInterval(fn, time);
}

// Tiny cache for stocks -> to avoid dupes basically
let stocksRefCache = null;
try {
  redisClient.hget('__STOCK_CONTROL__', 'REF_CACHE', (err, refCache) => {
    if (err) throw new Error('Redis service error:', err);
    stocksRefCache = refCache;
    console.log('stocksRefCache:', stocksRefCache);
    // Once we are ready, we set the requesting clock and start requesting stock data asap
    getStocksFromApiRef = intervalProvider();
  });
} catch (e) {
  console.error(e);
}


const errorSimulation = () => {
  // La API debera simular un 10% rate de errores usando el siguiente codigo:
  if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed')
};

let apiIsWorking = true;
const getStocksFromApi = async (stockNames = ['AAPL','ABC','MSFT','TSLA','F']) => {

  // Checking if market is open to adjust stocks fetching frequency accordingly
  const openingHour = new Date ().getHours();
  const openingDay = new Date ().getDay();
  // TODO: check out for 'real' opening hours
  // I'm assuming market is open between 07:00 and 18:00 hours from Monday to Friday
  const marketIsOpen = openingHour > 6 && openingHour < 18 && openingDay > 0 && openingDay < 6;
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

  try {
    errorSimulation();
    const url = `http://finance.google.com/finance/info?client=ig&q=${stockNames.join(',')}`;
    const stocks = await get(url);
    // check if last response is different from current response
    const hashedStocks = md5(stocks);
    console.log('stocks requested:', hashedStocks);
    if (stocksRefCache !== hashedStocks) {
      stocksRefCache = hashedStocks;
      // La data debera ser guardada en Redis,
      // usando Hashes para cada stock y el timestamp (unix) para cada transaccion guardada.
      const unixTime = Math.floor(new Date() / 1000);
      stocks.forEach((stock, i) => {
        const redisData = new Array();
        const redisKey = `${unixTime}:${stockNames[i]}`;
        Object.keys(stock).forEach((key) => {
          redisData.push(key, stock[key])
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
  } catch (e) {
    // Se debera capturar SOLAMENTE este error para los reintentos
    if (/unfortunate/.test(e)) {
      console.log('Simulated Error: Retrying in 30 seconds...');
      apiIsWorking = marketIsOpen ? false : true;
      intervalProvider(30 * 1000);
    }
    // si existe otro error (ej: se cayo el api) debera manejarse de otra manera
    // (informandole al usuario la ultima actualizacion, que no existe conexion con el api, etc).
  }
}

server.listen(port);

console.log(`Server running at port:${port}`);