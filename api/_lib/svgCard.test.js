import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFlatBadge } from './svgCard.js';

test('renderFlatBadge: sizes the two segments from label/value text length', () => {
  const svg = renderFlatBadge({ label: 'stars', value: '52' });

  assert.match(svg, /<svg width="(\d+)"/);
  const width = Number(svg.match(/<svg width="(\d+)"/)[1]);
  assert.ok(width > 0);
  assert.match(svg, />stars</);
  assert.match(svg, />52</);
});

test('renderFlatBadge: escapes label/value text', () => {
  const svg = renderFlatBadge({ label: '<script>', value: '1' });
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
});
