import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../github/stars-badge.js';

const makeRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  send(body) { this.body = body; return this; },
  json(body) { this.body = JSON.stringify(body); return this; },
});

test('stars-badge: renders the summed star count across the requested repos', async (t) => {
  process.env.GITHUB_TOKEN = 'test-token';
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => ({ stargazers_count: 25 }) }));

  const req = { method: 'GET', query: { username: 'awahids', repos: 'a,b' }, headers: {} };
  const res = makeRes();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body, />★ stars</);
  assert.match(res.body, />50</);
});

test('stars-badge: rejects a missing "repos" query param with a 400 error card', async () => {
  const req = { method: 'GET', query: { username: 'awahids' }, headers: {} };
  const res = makeRes();
  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Invalid or missing/);
});
