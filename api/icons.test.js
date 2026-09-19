import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveIcon } from './_lib/simpleIcons.js';
import { buildIconsGrid } from './icons.js';

test('resolveIcon: shorthand alias resolves to the real Simple Icons artwork', () => {
  const icon = resolveIcon('js');
  assert.equal(icon.slug, 'javascript');
  assert.equal(icon.title, 'JavaScript');
  assert.ok(icon.hex);
  assert.ok(icon.path && icon.path.startsWith('M'));
});

test('resolveIcon: a direct slug match works without an alias', () => {
  const icon = resolveIcon('docker');
  assert.equal(icon.title, 'Docker');
  assert.ok(icon.path);
});

test('resolveIcon: a brand withdrawn from Simple Icons (vscode) falls back gracefully', () => {
  const icon = resolveIcon('vscode');
  assert.equal(icon.path, null);
  assert.equal(icon.title, 'vscode');
});

test('buildIconsGrid: lays every icon out in a single row', () => {
  const svg = buildIconsGrid(['git', 'go', 'php']);
  assert.match(svg, /width="160"/);
  assert.match(svg, /height="48"/);
});
