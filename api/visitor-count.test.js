import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from './visitor-count.js';

const makeRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  send(body) { this.body = body; return this; },
  json(body) { this.body = JSON.stringify(body); return this; },
});

test('visitor-count: renders the incremented count and never sets a positive cache lifetime', async (t) => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => 7 }));

  const req = { method: 'GET', query: { username: 'awahids' }, headers: {} };
  const res = makeRes();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body, />7</);
  assert.match(res.headers['Cache-Control'], /s-maxage=0/);
});

test('visitor-count: rejects a missing username with a 400 error card', async () => {
  const req = { method: 'GET', query: {}, headers: {} };
  const res = makeRes();
  await handler(req, res);

  assert.equal(res.statusCode, 400);
});
