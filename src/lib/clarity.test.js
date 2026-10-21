import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CONSENT_STORAGE_KEY, saveConsent } from './consent.js';

// clarity.js remembers whether it already loaded, so every test imports a
// fresh copy of the module.
let copy = 0;
const freshClarity = async () => (await import(`./clarity.js?copy=${++copy}`)).initClarity;

let store;
let scripts;
beforeEach(() => {
  store = new Map();
  scripts = [];
  globalThis.window = Object.assign(new EventTarget(), {
    location: { hostname: 'awahids.my.id' },
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
    },
  });
  globalThis.document = {
    cookie: '',
    createElement: () => ({}),
    head: { appendChild: (node) => scripts.push(node) },
  };
});

const queued = () => (window.clarity?.q || []).map((args) => Array.from(args));

test('initClarity: no or malformed project id leaves Clarity off', async () => {
  const initClarity = await freshClarity();
  store.set(CONSENT_STORAGE_KEY, 'granted');
  for (const id of [undefined, '', 'a b', '<script>', 'x'.repeat(40)]) {
    assert.equal(initClarity(id), false, String(id));
  }
  assert.equal(scripts.length, 0);
  assert.equal(window.clarity, undefined);
});

test('initClarity: nothing loads before consent, then the tag loads on Accept', async () => {
  const initClarity = await freshClarity();
  assert.equal(initClarity('abc123xyz'), true);
  assert.equal(scripts.length, 0);
  assert.equal(window.clarity, undefined);

  saveConsent('granted');
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://www.clarity.ms/tag/abc123xyz');
  assert.equal(scripts[0].async, true);
  assert.deepEqual(queued(), [['consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }]]);
});

test('initClarity: a returning visitor who accepted gets Clarity right away', async () => {
  const initClarity = await freshClarity();
  store.set(CONSENT_STORAGE_KEY, 'granted');
  initClarity('abc123xyz');
  assert.equal(scripts.length, 1);
});

test('initClarity: declining after accepting revokes consent without loading the tag twice', async () => {
  const initClarity = await freshClarity();
  store.set(CONSENT_STORAGE_KEY, 'granted');
  initClarity('abc123xyz');
  saveConsent('denied');
  saveConsent('granted');
  assert.equal(scripts.length, 1);
  assert.deepEqual(queued(), [
    ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }],
    ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }],
    ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }],
  ]);
});

test('initClarity: declining when it never loaded keeps it unloaded', async () => {
  const initClarity = await freshClarity();
  initClarity('abc123xyz');
  saveConsent('denied');
  assert.equal(scripts.length, 0);
  assert.equal(window.clarity, undefined);
});
