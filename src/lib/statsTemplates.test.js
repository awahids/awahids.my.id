import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCardTheme } from './cardThemes.js';
import { STATS_SECTIONS, STATS_TEMPLATES, cleanSectionIds, findStatsTemplate, statsLayoutSettings } from './statsTemplates.js';

test('STATS_TEMPLATES: unique ids, known themes and known sections only', () => {
  const ids = STATS_TEMPLATES.map((template) => template.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const template of STATS_TEMPLATES) {
    assert.ok(isCardTheme(template.theme), template.id);
    assert.ok(isCardTheme(template.lightTheme), template.id);
    assert.deepEqual(cleanSectionIds(template.sections), template.sections, template.id);
    assert.ok(template.fits.length > 20, template.id);
  }
});

test('statsLayoutSettings: sets every section flag, on only for the listed ones', () => {
  const settings = statsLayoutSettings(findStatsTemplate('showcase'));
  assert.deepEqual(settings, {
    showTrophies: true,
    showRepoCards: true,
    showSnake: false,
    showCodeStats: false,
    showVisitorCounter: false,
    theme: 'tokyonight',
    lightTheme: 'light',
  });
  assert.equal(Object.keys(statsLayoutSettings({})).length, STATS_SECTIONS.length);
});

test('statsLayoutSettings: unknown themes and sections are left out, a light theme equal to the main one is cleared', () => {
  assert.deepEqual(statsLayoutSettings({ sections: ['snake', 'bogus', 'snake'], theme: 'nope', lightTheme: 'nope' }), {
    showTrophies: false,
    showRepoCards: false,
    showSnake: true,
    showCodeStats: false,
    showVisitorCounter: false,
  });
  assert.equal(statsLayoutSettings({ theme: 'nord', lightTheme: 'nord' }).lightTheme, '');
  assert.equal(statsLayoutSettings({ theme: 'nord', lightTheme: '' }).lightTheme, '');
});

test('cleanSectionIds: normalises case and drops junk', () => {
  assert.deepEqual(cleanSectionIds([' Trophies ', 'SNAKE', 'x', null]), ['trophies', 'snake']);
  assert.deepEqual(cleanSectionIds('trophies'), []);
});
