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
