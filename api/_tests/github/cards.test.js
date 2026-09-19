import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRank } from '../../github/stats.js';
import { computeStreakStats, formatRange } from '../../github/streak.js';

test('computeRank: matches the github-readme-stats formula (the numbers on the reported card give B+)', () => {
  const mine = computeRank({ stars: 61, commits: 1153, pullRequests: 40, issues: 4, reviews: 0, followers: 24 });
  assert.equal(mine.level, 'B+');
  assert.ok(Math.abs(mine.percentile - 48.3) < 0.1, `percentile ${mine.percentile}`);
});

test('computeRank: no activity is C, and S is reserved for the very top', () => {
  assert.equal(computeRank({}).level, 'C');
  assert.equal(computeRank({ stars: 500, commits: 2000, pullRequests: 300, issues: 100, reviews: 200, followers: 500 }).level, 'A+');
  assert.equal(computeRank({ stars: 1e6, commits: 1e6, pullRequests: 1e6, issues: 1e6, reviews: 1e6, followers: 1e6 }).level, 'S');
});

test('computeRank: more of any metric never makes the percentile worse', () => {
  const base = { stars: 10, commits: 100, pullRequests: 10, issues: 2, reviews: 1, followers: 5 };
  const basePercentile = computeRank(base).percentile;
  for (const key of Object.keys(base)) {
    assert.ok(computeRank({ ...base, [key]: base[key] + 50 }).percentile <= basePercentile, key);
  }
});

const day = (date, contributionCount) => ({ date, contributionCount });

test('computeStreakStats: counts a current streak that tolerates a not-yet-recorded "today"', () => {
  const stats = computeStreakStats([
    day('2026-01-01', 1),
    day('2026-01-02', 1),
    day('2026-01-03', 1),
    day('2026-01-04', 0),
  ]);

  assert.equal(stats.current, 3);
  assert.equal(stats.longest, 3);
  assert.equal(stats.total, 3);
});

test('computeStreakStats: a real gap (not the trailing day) breaks the current streak', () => {
  const stats = computeStreakStats([
    day('2026-01-01', 1),
    day('2026-01-02', 0),
    day('2026-01-03', 1),
    day('2026-01-04', 1),
  ]);

  assert.equal(stats.current, 2);
  assert.equal(stats.longest, 2);
});

test('computeStreakStats: longest streak can be earlier than the current one', () => {
  const stats = computeStreakStats([
    day('2026-01-01', 1),
    day('2026-01-02', 1),
    day('2026-01-03', 1),
    day('2026-01-04', 1),
    day('2026-01-05', 0),
    day('2026-01-06', 1),
  ]);

  assert.equal(stats.longest, 4);
  assert.equal(stats.current, 1);
});

test('computeStreakStats: reports the date range of the current and the longest streak', () => {
  const stats = computeStreakStats([
    day('2026-01-01', 1),
    day('2026-01-02', 1),
    day('2026-01-03', 1),
    day('2026-01-04', 1),
    day('2026-01-05', 0),
    day('2026-01-06', 1),
    day('2026-01-07', 1),
    day('2026-01-08', 0),
  ]);

  assert.deepEqual([stats.longest, stats.longestStart, stats.longestEnd], [4, '2026-01-01', '2026-01-04']);
  assert.deepEqual([stats.current, stats.currentStart, stats.currentEnd], [2, '2026-01-06', '2026-01-07']);
});

test('formatRange: short within a year, full across years, and a friendly empty state', () => {
  assert.equal(formatRange('2026-01-01', '2026-01-04'), 'Jan 1 - Jan 4');
  assert.equal(formatRange('2025-12-30', '2026-01-02'), 'Dec 30, 2025 - Jan 2, 2026');
  assert.equal(formatRange('2026-03-05', '2026-03-05'), 'Mar 5, 2026');
  assert.equal(formatRange(null, null), 'No streak yet');
});
