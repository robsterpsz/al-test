import http from 'http';

const port = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World!\n');
}).listen(port);

console.log(`Server running at port:${port}`);