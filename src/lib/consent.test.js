import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONSENT_STORAGE_KEY, clearAnalyticsCookies, readConsent, saveConsent } from './consent.js';

// Minimal browser stand-ins: localStorage, a cookie jar that honours expiry
// for the exact name/domain written, and gtag recording its calls.
let store;
let jar;
let gtagCalls;
beforeEach(() => {
  store = new Map();
  jar = new Map();
  gtagCalls = [];
  globalThis.window = Object.assign(new EventTarget(), {
    location: { hostname: 'www.awahids.my.id' },
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
    },
    gtag: (...args) => gtagCalls.push(args),
  });
  globalThis.document = {
    get cookie() {
      return [...jar.keys()].map((key) => `${key.split('|')[0]}=1`).join('; ');
    },
    set cookie(value) {
      const [pair, ...attrs] = value.split(';').map((part) => part.trim());
      const name = pair.split('=')[0];
      const domain = attrs.find((attr) => attr.startsWith('domain='))?.slice(7) ?? '';
      if (/expires=Thu, 01 Jan 1970/.test(value)) jar.delete(`${name}|${domain}`);
      else jar.set(`${name}|${domain}`, true);
    },
  };
});

test('readConsent: only "granted" or "denied" count as a choice', () => {
  assert.equal(readConsent(), null);
  store.set(CONSENT_STORAGE_KEY, 'granted');
  assert.equal(readConsent(), 'granted');
  store.set(CONSENT_STORAGE_KEY, 'maybe');
  assert.equal(readConsent(), null);
  window.localStorage.getItem = () => { throw new Error('blocked'); };
  assert.equal(readConsent(), null);
});

test('saveConsent: stores the choice and updates only analytics_storage', () => {
  saveConsent('granted');
  assert.equal(store.get(CONSENT_STORAGE_KEY), 'granted');
  assert.deepEqual(gtagCalls, [['consent', 'update', { analytics_storage: 'granted' }]]);

  saveConsent('bogus');
  assert.equal(store.get(CONSENT_STORAGE_KEY), 'granted');
  assert.equal(gtagCalls.length, 1);
});

test('saveConsent("denied"): removes GA cookies on any domain variant, keeps others', () => {
  jar.set('_ga|.awahids.my.id', true);
  jar.set('_ga_BGRDF5BFFD|.awahids.my.id', true);
  jar.set('_gid|www.awahids.my.id', true);
  jar.set('_gat|', true);
  jar.set('_clck|.awahids.my.id', true);
  jar.set('_clsk|.awahids.my.id', true);
  jar.set('theme|', true);
  jar.set('_clckx|', true);
  jar.set('_gallery|', true);

  saveConsent('denied');
  assert.deepEqual([...jar.keys()].sort(), ['_clckx|', '_gallery|', 'theme|']);
  assert.deepEqual(gtagCalls, [['consent', 'update', { analytics_storage: 'denied' }]]);
});

test('saveConsent: announces the new choice to tags that load on consent', () => {
  const seen = [];
  window.addEventListener('aw:consent-change', (event) => seen.push(event.detail));
  saveConsent('granted');
  saveConsent('denied');
  saveConsent('bogus');
  assert.deepEqual(seen, ['granted', 'denied']);
});

test('saveConsent: works when storage is blocked', () => {
  window.localStorage.setItem = () => { throw new Error('blocked'); };
  assert.doesNotThrow(() => saveConsent('granted'));
  assert.equal(gtagCalls.length, 1);
});

test('clearAnalyticsCookies: no cookies is a no-op', () => {
  assert.doesNotThrow(clearAnalyticsCookies);
});

test('index.html: consent defaults come before gtag config and before gtag.js loads, with the same storage key', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const defaults = html.indexOf("gtag('consent', 'default'");
  assert.ok(defaults > 0);
  assert.ok(defaults < html.indexOf("gtag('config', 'G-BGRDF5BFFD')"));
  assert.ok(defaults < html.indexOf('googletagmanager.com/gtag/js'));
  for (const signal of ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage']) {
    assert.match(html, new RegExp(`${signal}: 'denied'`));
  }
  assert.match(html, new RegExp(`localStorage.getItem\\('${CONSENT_STORAGE_KEY}'\\) === 'granted'`));
});
