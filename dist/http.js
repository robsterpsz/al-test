'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = exports.server = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var checkMimeType = true;

var server = exports.server = _http2.default.createServer(function (req, res) {
  var filename = req.url == '/' ? '/index.html' : req.url;
  var ext = _path2.default.extname(filename);
  var publicPath = _path2.default.join(__dirname, '../public');
  var defaultPath = _path2.default.join(__dirname, '../public/index.html');
  var validExtensions = {
    '.css': 'text/css',
    '.gif': 'image/gif',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2'
  };

  var validMimeType = true;
  var mimeType = validExtensions[ext];

  if (checkMimeType) {
    validMimeType = validExtensions[ext] != undefined;
  }

  if (validMimeType) {
    publicPath += filename;
    _fs2.default.exists(publicPath, function (exists) {
      if (exists) {
        getFile(publicPath, res, mimeType);
      } else {
        res.setHeader('Location', '/');
        getFile(defaultPath, res, 'text/html');
      }
    });
  } else {
    res.setHeader('Location', '/');
    getFile(defaultPath, res, 'text/html');
  }
});

var getFile = function getFile(localPath, res, mimeType) {
  _fs2.default.readFile(localPath, function (err, contents) {
    if (!err) {
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
};

// promisified getter to gather (very similar to) json content from an url
var get = exports.get = function get(url) {
  return new _promise2.default(function (resolve, reject) {
    _http2.default.get(url, function (res) {
      var statusCode = res.statusCode;


      var error = void 0;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' + ('Status Code: ' + statusCode));
      }
      if (error) {
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
        } catch (ex) {
          reject(ex);
        }
      });
    }).on('error', function (e) {
      reject(e.message);
    });
  });
};