import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRank } from './stats.js';
import { computeStreakStats } from './streak.js';

test('computeRank: zero activity grades C, heavy activity approaches S', () => {
  assert.equal(computeRank({ stars: 0, commits: 0, pullRequests: 0, issues: 0, reviews: 0 }).grade, 'C');
  const heavy = computeRank({ stars: 500, commits: 2000, pullRequests: 300, issues: 100, reviews: 200 });
  assert.equal(heavy.grade, 'S');
  assert.ok(heavy.score <= 100);
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
