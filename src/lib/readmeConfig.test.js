import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, decodeConfig, encodeConfig } from './readmeConfig.js';

const customConfig = () => ({
  ...structuredClone(DEFAULT_CONFIG),
  username: 'awahids',
  pinnedReposText: 'belajar-ngaji, aw-prd',
  showVisitorCounter: true,
  showCodeStats: true,
  codeStatsLangsText: 'Go, C#',
  showRepoCards: true,
  showSnake: true,
  showTrophies: true,
  taglineText: 'Halo & selamat datang!\nBaris kedua',
  bioText: 'Backend engineer.\nSuka kopi = semangat?',
  skillIds: ['go', 'docker'],
  socials: { github: 'awahids', linkedin: '', instagram: 'awhds_', email: 'a@b.co', website: 'https://awahids.my.id' },
  theme: 'dracula',
  lightTheme: 'light',
  typing: { font: 'serif', bold: true, speed: 'fast', align: 'left', size: 42, color: 'c8ff00' },
});

test('encodeConfig: the defaults encode to an empty query', () => {
  assert.equal(encodeConfig(DEFAULT_CONFIG), '');
  assert.deepEqual(decodeConfig(''), DEFAULT_CONFIG);
});

test('encodeConfig/decodeConfig: every setting survives a round trip, special characters included', () => {
  const config = customConfig();
  assert.deepEqual(decodeConfig(`?${encodeConfig(config)}`), config);
});

test('encodeConfig: only changed settings are written, with short param names', () => {
  const query = encodeConfig({ ...structuredClone(DEFAULT_CONFIG), username: 'awahids', showTrophies: true });
  assert.equal(query, 'u=awahids&tr=1');
});

test('encodeConfig: emptied fields are kept apart from untouched defaults', () => {
  const config = { ...structuredClone(DEFAULT_CONFIG), taglineText: '', skillIds: [] };
  const query = encodeConfig(config);
  assert.equal(query, 'tag=&skills=');
  const decoded = decodeConfig(query);
  assert.equal(decoded.taglineText, '');
  assert.deepEqual(decoded.skillIds, []);
});

test('decodeConfig: invalid values fall back to the defaults, and unknown params are ignored', () => {
  const decoded = decodeConfig(
    'theme=nope&light=nope&font=comic&speed=warp&align=up&size=abc&color=zz12&skills=go,not-real,go&evil=1'
  );
  assert.equal(decoded.theme, DEFAULT_CONFIG.theme);
  assert.equal(decoded.lightTheme, '');
  assert.deepEqual(decoded.typing, { ...DEFAULT_CONFIG.typing, color: '12' });
  assert.deepEqual(decoded.skillIds, ['go']);
  assert.equal('evil' in decoded, false);
});

test('decodeConfig: numbers are clamped and long text is cut', () => {
  assert.equal(decodeConfig('size=999').typing.size, 60);
  assert.equal(decodeConfig('size=1').typing.size, 14);
  assert.equal(decodeConfig(`bio=${'x'.repeat(5000)}`).bioText.length, 2000);
});

test('decodeConfig: never shares nested objects with the defaults', () => {
  const decoded = decodeConfig('');
  decoded.socials.github = 'changed';
  decoded.skillIds.push('rust');
  assert.equal(DEFAULT_CONFIG.socials.github, '');
  assert.equal(DEFAULT_CONFIG.skillIds.includes('rust'), false);
});
