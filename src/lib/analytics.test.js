import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toGaEventName, trackEvent } from './analytics.js';

test('toGaEventName: Plausible-style names become GA4 snake_case', () => {
  assert.equal(toGaEventName('CVDownload'), 'cv_download');
  assert.equal(toGaEventName('BookingCTA'), 'booking_cta');
  assert.equal(toGaEventName('ReadmeAiAsk'), 'readme_ai_ask');
  assert.equal(toGaEventName('FAQ Question'), 'faq_question');
  assert.ok(toGaEventName('X'.repeat(80)).length <= 40);
});

test('trackEvent: sends to both tools, and a throwing tool never escapes', () => {
  const calls = [];
  globalThis.window = {
    plausible: (name, options) => calls.push(['plausible', name, options]),
    gtag: (...args) => calls.push(['gtag', ...args]),
  };
  trackEvent('CVDownload', { source: 'hero' });
  assert.deepEqual(calls, [
    ['plausible', 'CVDownload', { props: { source: 'hero' } }],
    ['gtag', 'event', 'cv_download', { source: 'hero' }],
  ]);

  globalThis.window = { plausible: () => { throw new Error('blocked'); } };
  assert.doesNotThrow(() => trackEvent('CVDownload'));

  globalThis.window = {};
  assert.doesNotThrow(() => trackEvent('CVDownload'));
  delete globalThis.window;
});
