const http = require('http');

async function run() {
  const mock = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost:5097');

    if (req.method === 'GET' && u.pathname === '/page') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        '<html><body><a href="/form">Form</a><form method="post" action="/echo"><input name="username"/><input name="password" type="password"/></form></body></html>'
      );
      return;
    }

    if (req.method === 'GET' && u.pathname === '/form') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        '<html><body><form method="post" action="/echo"><input name="q"/></form></body></html>'
      );
      return;
    }

    if (req.method === 'GET' && u.pathname === '/echo') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html>ok</html>');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (u.pathname === '/echo') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'ok', body }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise((resolve) => mock.listen(5097, resolve));

  try {
    const response = await fetch('http://localhost:5012/api/pipeline/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'http://localhost:5097/page',
        depth: 1,
        maxPages: 5,
        timeoutMs: 4000
      })
    });

    const text = await response.text();
    console.log(text);
  } finally {
    await new Promise((resolve) => mock.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
