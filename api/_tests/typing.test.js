import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTypingTimeline } from '../typing.js';

test('buildTypingTimeline: a single line has strictly increasing keyTimes from 0 to 1', () => {
  const { perLine, totalSec } = buildTypingTimeline(['Hi'], { pauseMs: 2000, charWidth: 12 });
  const [line] = perLine;

  assert.equal(line.keyTimes[0], 0);
  assert.equal(line.keyTimes[line.keyTimes.length - 1], 1);
  for (let i = 1; i < line.keyTimes.length; i += 1) {
    assert.ok(line.keyTimes[i] > line.keyTimes[i - 1], 'keyTimes must strictly increase');
  }
  assert.ok(totalSec > 0);
});

test('buildTypingTimeline: each line is only revealed during its own window', () => {
  const { perLine } = buildTypingTimeline(['Hello', 'World'], { pauseMs: 500, charWidth: 10 });
  const [first, second] = perLine;

  // First line: width goes up to its own textWidth then back to 0 before the end.
  assert.ok(Math.max(...first.values) === first.textWidth);
  assert.equal(first.values[first.values.length - 1], 0);

  // Second line starts at 0 and only reaches its textWidth partway through.
  assert.equal(second.values[0], 0);
  assert.ok(Math.max(...second.values) === second.textWidth);
});

test('buildTypingTimeline: keyTimes stay strictly increasing across multiple lines', () => {
  const { perLine } = buildTypingTimeline(['a', 'bb', 'ccc'], { pauseMs: 100, charWidth: 8 });
  for (const line of perLine) {
    for (let i = 1; i < line.keyTimes.length; i += 1) {
      assert.ok(line.keyTimes[i] > line.keyTimes[i - 1]);
    }
  }
});

import handler from '../typing.js';

const render = (query) => {
  const res = { headers: {}, statusCode: 200, body: '', setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, send(b) { this.body = b; return this; }, json(b) { this.body = JSON.stringify(b); return this; } };
  handler({ method: 'GET', headers: { 'x-forwarded-for': `10.9.0.${Math.floor(Math.random() * 250)}` }, query }, res);
  return res;
};

test('typing: speed changes the whole animation length', () => {
  const dur = (speed) => Number(render({ lines: 'Hello world', speed }).body.match(/dur="([\d.]+)s"/)[1]);
  assert.ok(dur('slow') > dur('normal'));
  assert.ok(dur('normal') > dur('fast'));
});

test('typing: font and weight map to safe font stacks, unknown values fall back', () => {
  assert.match(render({ lines: 'Hi', font: 'serif' }).body, /font-family="Georgia/);
  assert.match(render({ lines: 'Hi', font: 'sans', weight: 'bold' }).body, /Segoe UI[^"]*" font-size="20" font-weight="700"/);
  assert.match(render({ lines: 'Hi', font: '"><script>' }).body, /font-family="Consolas/);
  assert.doesNotMatch(render({ lines: 'Hi', font: '"><script>' }).body, /<script>/);
});

test('typing: each line is revealed from its own left edge, so centered text is never cut off', () => {
  const svg = render({ lines: 'Short;A much longer second line', align: 'center' }).body;
  const clipXs = [...svg.matchAll(/<clipPath id="typing-clip-\d">\s*<rect x="([\d.]+)"/g)].map((m) => Number(m[1]));
  const textXs = [...svg.matchAll(/<text x="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(clipXs, textXs);
  assert.ok(textXs[0] > textXs[1], 'the shorter line starts further right when centered');
});

test('typing: align right pins the text to the right edge, and center=true still works', () => {
  const right = render({ lines: 'Short;A much longer second line', align: 'right' }).body;
  const rightXs = [...right.matchAll(/<text x="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.ok(rightXs[0] > rightXs[1]);
  const legacy = render({ lines: 'Short;A much longer second line', center: 'true' }).body;
  assert.deepEqual([...legacy.matchAll(/<text x="([\d.]+)"/g)].map((m) => Number(m[1])), [...render({ lines: 'Short;A much longer second line', align: 'center' }).body.matchAll(/<text x="([\d.]+)"/g)].map((m) => Number(m[1])));
});

test('typing: color falls back to the theme accent and an explicit color wins', () => {
  assert.match(render({ lines: 'Hi', theme: 'nord' }).body, /fill="#81a1c1"/);
  assert.match(render({ lines: 'Hi', theme: 'nord', color: 'ff0000' }).body, /fill="#ff0000"/);
  assert.match(render({ lines: 'Hi' }).body, /fill="#e4e6f1"/);
});
