import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import handler from '../../github/[card].js';
import { CARD_HANDLERS } from '../../_lib/cards/index.js';

const makeRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  send(body) { this.body = body; return this; },
  json(body) { this.body = JSON.stringify(body); return this; },
});

test('card dispatcher: routes the [card] path segment to that card', async () => {
  const res = makeRes();
  // stars-badge answers a missing "repos" param with its own 400 card.
  await handler({ method: 'GET', query: { card: 'stars-badge', username: 'awahids' }, headers: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Invalid or missing &quot;username&quot;\/&quot;repos&quot;/);
});

test('card dispatcher: unknown cards and prototype keys get a 404 card', async () => {
  for (const card of ['nope', '__proto__', 'constructor', 'toString', '']) {
    const res = makeRes();
    await handler({ method: 'GET', query: { card, username: 'awahids' }, headers: {} }, res);
    assert.equal(res.statusCode, 404, card);
    assert.equal(res.headers['Content-Type'], 'image/svg+xml');
  }
});

test('card dispatcher: every /api/github/* URL the README template emits has a handler', () => {
  const template = readFileSync(new URL('../../../src/lib/readmeTemplate.js', import.meta.url), 'utf8');
  const cards = [...template.matchAll(/'\/api\/github\/([a-z-]+)'/g)].map((match) => match[1]);
  assert.ok(cards.length >= 7);
  for (const card of cards) assert.ok(Object.hasOwn(CARD_HANDLERS, card), card);
});

test('api/: stays within the 12-function Hobby plan limit', () => {
  // Vercel deploys every .js file under api/ as a function, except paths with
  // a segment starting with "_" (shared code and tests live there).
  const count = (dir) =>
    readdirSync(dir, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith('_'))
      .reduce((total, entry) => total + (entry.isDirectory() ? count(`${dir}/${entry.name}`) : entry.name.endsWith('.js') ? 1 : 0), 0);
  const functions = count(new URL('../..', import.meta.url).pathname.replace(/\/$/, ''));
  assert.ok(functions <= 12, `${functions} functions`);
});
