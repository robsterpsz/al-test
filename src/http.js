import fs from 'fs';
import http from 'http';
import path from 'path';


/**
 * Basic Node.js web server
 * @see https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_http_createserver_requestlistener
 */
export const server = http.createServer((req, res) => {
  const checkMimeType = true;
  const filename = req.url == '/' ? '/index.html' : req.url;
  const ext = path.extname(filename);
  console.log('__dirname', __dirname);
  // const defaultFile = path.join(__dirname, 'public/index.html');
  const defaultFile = 'public/index.html';
  // let publicPath = path.join(__dirname, 'public');
  let publicPath = 'public';
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

  const getFile = (localPath, res, mimeType) => {
    console.log('getFile', localPath, mimeType);
    fs.readFile(localPath, function(err, contents) {
      if(!err) {
        res.setHeader('Content-Length', contents.length);
        if (mimeType != undefined) {
          res.setHeader('Content-Type', mimeType);
        }
        res.statusCode = 200;
        res.end(contents);
      } else {
        console.log('getFile err', err);
        res.writeHead(500);
        res.end();
      }
    });
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
        res.setHeader('Location', '/');
        getFile(defaultFile, res, 'text/html');
      }
    });
  } else {
    res.setHeader('Location', '/');
    getFile(defaultFile, res, 'text/html');
  }


});


/**
 * Promisyfied getter to gather (very similar to) json content from an url
 * @param  {String} url URL resource
 * @return {Object} JSON data
 * @see https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_http_get_options_callback
 */
export const get = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      }
      if (error) {
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
        } catch (ex) {
          reject(ex);
        }
      });
    }).on('error', (e) => {
      reject(e.message);
    });
  });
};
