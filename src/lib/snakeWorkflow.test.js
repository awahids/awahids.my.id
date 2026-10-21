import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSnakeWorkflow, snakeImageUrls } from './snakeWorkflow.js';

test('snakeImageUrls: points at the output branch of the profile repo', () => {
  assert.deepEqual(snakeImageUrls(' awahids '), {
    light: 'https://raw.githubusercontent.com/awahids/awahids/output/github-snake.svg',
    dark: 'https://raw.githubusercontent.com/awahids/awahids/output/github-snake-dark.svg',
  });
});

test('snakeImageUrls: rejects anything that is not a GitHub login', () => {
  for (const name of ['', 'a"b', 'a/b', 'x'.repeat(40), undefined]) {
    assert.equal(snakeImageUrls(name), null, String(name));
  }
});

test('buildSnakeWorkflow: writes both palettes to dist and keeps the GitHub expressions intact', () => {
  const yaml = buildSnakeWorkflow();
  assert.match(yaml, /uses: Platane\/snk\/svg-only@v3/);
  assert.match(yaml, /github_user_name: \$\{\{ github\.repository_owner \}\}/);
  assert.match(yaml, /^ {12}dist\/github-snake\.svg$/m);
  assert.match(yaml, /^ {12}dist\/github-snake-dark\.svg\?palette=github-dark$/m);
  assert.match(yaml, /target_branch: output/);
  assert.match(yaml, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
});
