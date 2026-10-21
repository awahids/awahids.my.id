import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CODE_STATS_END,
  CODE_STATS_START,
  DEFAULT_HIGHLIGHT_LANGS,
  buildCodeStatsWorkflow,
  parseHighlightLangs,
} from './codeStatsWorkflow.js';

test('parseHighlightLangs: trims, dedupes and keeps cloc names like C# and Vuejs Component', () => {
  assert.deepEqual(parseHighlightLangs(' Go, C#,  Vuejs   Component,Go,, C++ '), ['Go', 'C#', 'Vuejs Component', 'C++']);
});

test('parseHighlightLangs: drops names that could break out of the YAML string', () => {
  assert.deepEqual(parseHighlightLangs('Go, Bad"Name, ${{ secrets.X }}, a\\b'), ['Go']);
});

test('parseHighlightLangs: falls back to the defaults when nothing valid is left', () => {
  assert.deepEqual(parseHighlightLangs(''), DEFAULT_HIGHLIGHT_LANGS);
  assert.deepEqual(parseHighlightLangs('"'), DEFAULT_HIGHLIGHT_LANGS);
});

test('buildCodeStatsWorkflow: writes the chosen languages and keeps the GitHub expressions intact', () => {
  const yaml = buildCodeStatsWorkflow({ highlightLangs: ['Go', 'Rust'] });
  assert.match(yaml, /^ {6}HIGHLIGHT_LANGS: "Go,Rust"$/m);
  assert.match(yaml, /SOURCE_USERNAME: \$\{\{ inputs\.username \|\| vars\.PUBLIC_STATS_USERNAME \|\| github\.repository_owner \}\}/);
  assert.match(yaml, /for INDEX in "\$\{!REPOS\[@\]\}"; do/);
  assert.ok(yaml.includes(`start = "${CODE_STATS_START}"`));
  assert.ok(yaml.includes(`end = "${CODE_STATS_END}"`));
  // Python newline escapes must survive the JS template literal.
  assert.ok(yaml.includes('before + start + "\\n" + "\\n".join(rows) + "\\n" + end + after'));
});

test('buildCodeStatsWorkflow: no languages means the defaults', () => {
  assert.match(buildCodeStatsWorkflow(), new RegExp(`HIGHLIGHT_LANGS: "${DEFAULT_HIGHLIGHT_LANGS.join(',')}"`));
});
