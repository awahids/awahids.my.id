import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIERS, TROPHIES, buildTrophiesCard, computeTrophies } from '../../_lib/cards/trophies.js';
import { cardThemeColors } from '../../../src/lib/cardThemes.js';

const tierOf = (totals, key) => computeTrophies(totals).find((trophy) => trophy.key === key).tier;

test('computeTrophies: every threshold boundary lands on the matching tier', () => {
  for (const { key, thresholds } of TROPHIES) {
    assert.equal(tierOf({ [key]: thresholds[0] - 1 }, key), null, `${key} below C`);
    thresholds.forEach((min, index) => {
      assert.equal(tierOf({ [key]: min }, key), TIERS[index], `${key} at ${min}`);
    });
    assert.equal(tierOf({ [key]: thresholds.at(-1) * 10 }, key), 'S', `${key} far above S`);
  }
});

test('computeTrophies: thresholds rise with every tier', () => {
  for (const { key, thresholds } of TROPHIES) {
    assert.equal(thresholds.length, TIERS.length, key);
    thresholds.slice(1).forEach((min, index) => assert.ok(min > thresholds[index], key));
  }
});

test('computeTrophies: missing or junk totals count as zero (locked)', () => {
  for (const trophy of computeTrophies({ stars: 'lots', commits: undefined })) {
    assert.equal(trophy.value, 0);
    assert.equal(trophy.tier, null);
  }
});

test('buildTrophiesCard: one tile per trophy, earned tiers shown, locked ones dashed', () => {
  const svg = buildTrophiesCard(
    { totals: { stars: 61, commits: 1153, pullRequests: 40, reviews: 0, followers: 24, repos: 38 } },
    { colors: cardThemeColors('default'), hideBorder: false }
  );
  assert.equal((svg.match(/<rect x="\d+" y="15" width="115"/g) || []).length, TROPHIES.length);
  assert.match(svg, /width="770"/);
  assert.match(svg, />AAA</);
  assert.match(svg, />1\.2K</);
  assert.match(svg, />Pull Requests</);
  assert.equal((svg.match(/>–</g) || []).length, 1);
});
