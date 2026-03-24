const http = require('http');

const scannerBase = 'http://localhost:5010';

function json(res, obj, status = 200, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(obj));
}

function text(res, body, status = 200, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain', ...headers });
  res.end(body);
}

function buildTargetServer() {
  return http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost:5098');

    if (req.method === 'GET' && u.pathname === '/page') {
      text(
        res,
        '<html><body><a href="/a">A</a><form method="post" action="/submit"><input name="username"/></form></body></html>'
      );
      return;
    }

    if (req.method === 'GET' && u.pathname === '/csrf') {
      text(
        res,
        '<html><body><form method="POST" action="/do"><input name="amount"/></form></body></html>'
      );
      return;
    }

    if (req.method === 'GET' && u.pathname === '/headers') {
      text(res, 'ok');
      return;
    }

    if (req.method === 'GET' && u.pathname === '/path') {
      const file = u.searchParams.get('file') || u.searchParams.get('path') || '';
      if (file.includes('..')) {
        text(res, 'root:x:0:0:root:/root:/bin/bash');
      } else {
        text(res, 'not found');
      }
      return;
    }

    if (req.method === 'GET' && u.pathname === '/sensitive') {
      text(res, 'api_key = ABCDEFGHIJKLMNOPQRST password: supersecret123');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const route = u.pathname;

      if (route === '/echo') {
        let obj = {};
        try {
          obj = body ? JSON.parse(body) : {};
        } catch (error) {
          obj = {};
        }

        const valueText = Object.values(obj).join(' ');
        let message = 'safe';

        if (/script|onerror|javascript:/i.test(valueText)) {
          message = '<script>alert(1)</script>';
        }

        if (/\b(or|union|select|--)\b|'/i.test(valueText)) {
          message = 'SQL syntax error near input';
        }

        if (/uid=|whoami|uname|;|&&|\|/.test(valueText)) {
          message = 'uid=1000(app) gid=1000(app)';
        }

        if (/ldap|\*\)|objectClass/i.test(valueText)) {
          message = 'LDAP invalid filter';
        }

        json(res, { message });
        return;
      }

      if (route === '/nosql') {
        let obj = {};
        try {
          obj = body ? JSON.parse(body) : {};
        } catch (error) {
          obj = {};
        }

        const raw = JSON.stringify(obj);
        if (
          raw.includes('$ne') ||
          raw.includes('$gt') ||
          raw.includes('$regex') ||
          raw.includes('$where')
        ) {
          json(res, { error: 'mongodb badvalue unknown operator' });
        } else {
          json(res, { ok: true });
        }
        return;
      }

      if (route === '/xml') {
        if (body.includes('<!DOCTYPE')) {
          text(res, 'root:x:0:0:root:/root:/bin/bash');
        } else {
          text(res, 'ok');
        }
        return;
      }

      if (route === '/upload') {
        text(res, 'upload success file saved at /tmp/shell.php');
        return;
      }

      if (route === '/login') {
        let obj = {};
        try {
          obj = body ? JSON.parse(body) : {};
        } catch (error) {
          obj = {};
        }

        if (
          (obj.username === 'admin' && obj.password === 'admin') ||
          (obj.username === 'guest' && obj.password === 'guest')
        ) {
          json(res, { token: 'abc123', message: 'welcome dashboard' });
        } else {
          json(res, { error: 'invalid credentials' }, 401);
        }
        return;
      }

      json(res, { ok: true });
    });
  });
}

async function call(label, url, opt = {}) {
  try {
    const response = await fetch(url, opt);
    const textBody = await response.text();
    let parsed;

    try {
      parsed = JSON.parse(textBody);
    } catch (error) {
      parsed = textBody;
    }

    return {
      label,
      status: response.status,
      ok: response.ok,
      response: parsed
    };
  } catch (error) {
    return {
      label,
      ok: false,
      error: error.message
    };
  }
}

async function run() {
  const target = buildTargetServer();

  await new Promise((resolve) => {
    target.listen(5098, resolve);
  });

  const results = [];

  results.push(await call('phase1-root', `${scannerBase}/`));

  results.push(
    await call(
      'phase2-crawl-links',
      `${scannerBase}/api/crawl/links?url=${encodeURIComponent('http://localhost:5098/page')}`
    )
  );

  results.push(
    await call(
      'phase2-crawl-forms',
      `${scannerBase}/api/crawl/forms?url=${encodeURIComponent('http://localhost:5098/page')}`
    )
  );

  results.push(
    await call(
      'phase2-crawl-site',
      `${scannerBase}/api/crawl/site?url=${encodeURIComponent('http://localhost:5098/page')}&depth=1&maxPages=5`
    )
  );

  results.push(await call('phase3-payload-types', `${scannerBase}/api/payloads/types`));
  results.push(await call('phase3-payload-list-sql', `${scannerBase}/api/payloads?type=sql`));

  results.push(
    await call('phase3-payload-inject', `${scannerBase}/api/payloads/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: ['username', 'password'], type: 'sql', payloadIndex: 0 })
    })
  );

  results.push(
    await call('phase4-sql-test', `${scannerBase}/api/sql/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/echo', inputs: ['username'] })
    })
  );

  results.push(
    await call('phase5-xss-test', `${scannerBase}/api/xss/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/echo', inputs: ['comment'] })
    })
  );

  results.push(
    await call(
      'phase5-csrf-test',
      `${scannerBase}/api/csrf/test?url=${encodeURIComponent('http://localhost:5098/csrf')}`
    )
  );

  results.push(
    await call('phase5-command-test', `${scannerBase}/api/command-injection/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/echo', inputs: ['cmd'] })
    })
  );

  results.push(
    await call('phase5-xxe-test', `${scannerBase}/api/xxe/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/xml' })
    })
  );

  results.push(
    await call('phase5-path-traversal-test', `${scannerBase}/api/path-traversal/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/path', paramNames: ['file'] })
    })
  );

  results.push(
    await call('phase5-ldap-test', `${scannerBase}/api/ldap-injection/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/echo', inputs: ['username'] })
    })
  );

  results.push(
    await call('phase5-nosql-test', `${scannerBase}/api/nosql-injection/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/nosql', inputs: ['username'] })
    })
  );

  results.push(
    await call('phase5-file-upload-test', `${scannerBase}/api/file-upload/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/upload' })
    })
  );

  results.push(
    await call(
      'phase5-security-headers-test',
      `${scannerBase}/api/security-headers/test?url=${encodeURIComponent('http://localhost:5098/headers')}`
    )
  );

  results.push(
    await call('phase5-broken-auth-test', `${scannerBase}/api/broken-auth/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://localhost:5098/login' })
    })
  );

  results.push(
    await call(
      'phase5-sensitive-data-test',
      `${scannerBase}/api/sensitive-data-exposure/test?url=${encodeURIComponent('http://localhost:5098/sensitive')}`
    )
  );

  console.log(JSON.stringify(results, null, 2));

  await new Promise((resolve) => {
    target.close(resolve);
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
