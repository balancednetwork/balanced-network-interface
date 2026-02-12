/**
 * Local dev server for the CoinGecko API proxy.
 * Run with: pnpm run dev:coingecko (from apps/web)
 * Vite proxies /api/coingecko to http://localhost:3001
 */
const http = require('http');
const url = require('url');

const PORT = 3001;
const handler = require('./coingecko.js');

function createRes(response) {
  let statusCode = 200;
  const headers = {};
  return {
    setHeader(name, value) {
      headers[name] = value;
    },
    getHeader(name) {
      return headers[name];
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      headers['Content-Type'] = 'application/json';
      response.writeHead(statusCode, headers);
      response.end(JSON.stringify(body));
    },
    end(body) {
      response.writeHead(statusCode, headers);
      response.end(body);
    },
  };
}

const server = http.createServer((req, response) => {
  const parsed = url.parse(req.url || '', true);
  const reqWithQuery = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: parsed.query,
    socket: req.socket,
  };
  const res = createRes(response);
  handler(reqWithQuery, res).catch(err => {
    console.error('Handler error:', err);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Internal server error', message: err.message }));
  });
});

server.listen(PORT, () => {
  console.log(`CoinGecko API proxy listening on http://localhost:${PORT}`);
  console.log(`Test: curl "http://localhost:${PORT}?path=simple/price&ids=bitcoin&vs_currencies=usd"`);
});
