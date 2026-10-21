import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { buildRepoCard, wrapDescription } from '../../_lib/cards/repo-card.js';
import { cardThemeColors } from '../../../src/lib/cardThemes.js';

const makeRes = () => ({
  statusCode: 200,
  headers: {},
  body: '',
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  send(body) { this.body = body; return this; },
  json(body) { this.body = JSON.stringify(body); return this; },
});

const repo = (overrides = {}) => ({
  name: 'belajar-ngaji',
  nameWithOwner: 'awahids/belajar-ngaji',
  description: 'Learn to read the Quran',
  stargazerCount: 1234,
  forkCount: 5,
  isArchived: false,
  isPrivate: false,
  primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
  ...overrides,
});

const graphqlResponse = (repository) => async () => ({
  status: 200,
  headers: new Map(),
  json: async () => ({ data: { repository } }),
});

test('wrapDescription: wraps on words and ends overflowing text with an ellipsis', () => {
  assert.deepEqual(wrapDescription('one two three', 7, 2), ['one two', 'three']);
  assert.deepEqual(wrapDescription('one two three four', 7, 2), ['one two', 'three…']);
  assert.deepEqual(wrapDescription('abcdefghij', 5, 2), ['abcd…']);
  assert.deepEqual(wrapDescription('', 10, 2), []);
});

test('buildRepoCard: shows name, language, compact stars and forks, and escapes text', () => {
  const svg = buildRepoCard(repo({ description: '<b>bold</b> & more' }), { colors: cardThemeColors('default'), hideBorder: false });
  assert.match(svg, />belajar-ngaji</);
  assert.match(svg, />TypeScript</);
  assert.match(svg, /fill="#3178c6"/);
  assert.match(svg, /1\.2K/);
  assert.match(svg, />5</);
  assert.match(svg, /&lt;b&gt;bold&lt;\/b&gt; &amp; more/);
  assert.doesNotMatch(svg, /Archived/);
});

test('buildRepoCard: handles a repo with no description or language, and flags archived ones', () => {
  const svg = buildRepoCard(repo({ description: null, primaryLanguage: null, isArchived: true }), {
    colors: cardThemeColors('default'),
    hideBorder: true,
  });
  assert.match(svg, /No description provided/);
  assert.match(svg, />Archived</);
  assert.doesNotMatch(svg, /stroke-width="1"/);
});

test('repo-card: renders the repo with the requested theme', async (t) => {
  process.env.GITHUB_TOKEN = 'test-token';
  const fetchMock = t.mock.method(global, 'fetch', graphqlResponse(repo()));
  const res = makeRes();
  await handler({ method: 'GET', query: { username: 'awahids', repo: 'belajar-ngaji', theme: 'dracula' }, headers: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Content-Type'], 'image/svg+xml');
  assert.match(res.body, />belajar-ngaji</);
  assert.match(res.body, /fill="#282a36"/);
  const { variables } = JSON.parse(fetchMock.mock.calls[0].arguments[1].body);
  assert.deepEqual(variables, { owner: 'awahids', name: 'belajar-ngaji' });
});

test('repo-card: rejects a missing or malformed "repo" param before calling GitHub', async (t) => {
  const fetchMock = t.mock.method(global, 'fetch', graphqlResponse(repo()));
  for (const query of [{ username: 'awahids' }, { username: 'awahids', repo: '../x"' }]) {
    const res = makeRes();
    await handler({ method: 'GET', query, headers: {} }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body, /Invalid or missing &quot;repo&quot;/);
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('repo-card: a private repo is reported as not found', async (t) => {
  process.env.GITHUB_TOKEN = 'test-token';
  t.mock.method(global, 'fetch', graphqlResponse(repo({ isPrivate: true })));
  const res = makeRes();
  await handler({ method: 'GET', query: { username: 'awahids', repo: 'secret' }, headers: {} }, res);

  assert.equal(res.statusCode, 404);
  assert.doesNotMatch(res.body, /belajar-ngaji|Learn to read/);
});

test('repo-card: a query timeoutMs never reaches the GitHub fetch options of profile cards', async () => {
  // Guard for the shared handler: only the username goes to the profile fetch.
  const { handleGithubCardRequest } = await import('../../_lib/githubCard.js');
  let received;
  const res = makeRes();
  await handleGithubCardRequest(
    { method: 'GET', query: { username: 'awahids', timeoutMs: '1' }, headers: {} },
    res,
    () => '<svg/>',
    { fetchData: async (...args) => { received = args; return {}; } }
  );
  assert.equal(received[0], 'awahids');
  assert.equal(res.body, '<svg/>');
});
