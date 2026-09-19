import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReadmeMarkdown } from './readmeTemplate.js';

const ORIGIN = 'https://awahids.my.id';

test('buildReadmeMarkdown: omits every optional section when its inputs are empty', () => {
  const markdown = buildReadmeMarkdown({}, { origin: ORIGIN });
  assert.equal(markdown, '');
});

test('buildReadmeMarkdown: username alone renders only the stats section', () => {
  const markdown = buildReadmeMarkdown({ username: 'awahids' }, { origin: ORIGIN });
  assert.match(markdown, /api\/github\/streak\?username=awahids/);
  assert.match(markdown, /api\/github\/stats\?username=awahids/);
  assert.doesNotMatch(markdown, /api\/typing/);
  assert.doesNotMatch(markdown, /skillicons\.dev/);
});

test('buildReadmeMarkdown: drops an unsafe (javascript:) social link but keeps a safe one', () => {
  const markdown = buildReadmeMarkdown(
    {
      socialLinks: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/awahids' },
        { label: 'Evil', url: 'javascript:alert(1)' },
      ],
    },
    { origin: ORIGIN }
  );

  assert.match(markdown, /linkedin\.com\/in\/awahids/);
  assert.doesNotMatch(markdown, /javascript:/);
});

test('buildReadmeMarkdown: escapes HTML-significant characters in bio text', () => {
  const markdown = buildReadmeMarkdown({ bio: ['<script>alert(1)</script>'] }, { origin: ORIGIN });
  assert.doesNotMatch(markdown, /<script>/);
  assert.match(markdown, /&lt;script&gt;/);
});

test('buildReadmeMarkdown: typing lines are URL-encoded and joined with ";"', () => {
  const markdown = buildReadmeMarkdown(
    { taglineLines: ['Hello, There! 👋', 'Nice to meet you!'] },
    { origin: ORIGIN }
  );
  assert.match(markdown, /api\/typing\?lines=Hello%2C\+There/);
});

test('buildReadmeMarkdown: renders every skill in one skillicons.dev image, in the chosen order', () => {
  const markdown = buildReadmeMarkdown({ skills: ['nestjs', 'ts', 'docker'] }, { origin: ORIGIN });
  assert.match(markdown, /https:\/\/skillicons\.dev\/icons\?i=nestjs,ts,docker&perline=10/);
  assert.equal((markdown.match(/<img /g) || []).length, 1);
  assert.doesNotMatch(markdown, /api\/icons|raw\.githubusercontent\.com/);
});

test('buildReadmeMarkdown: unknown skill ids are dropped', () => {
  const markdown = buildReadmeMarkdown({ skills: ['not-a-real-icon', 'react'] }, { origin: ORIGIN });
  assert.match(markdown, /icons\?i=react&perline/);
  assert.doesNotMatch(markdown, /not-a-real-icon/);
});

test('buildReadmeMarkdown: only unknown skills means no skills section at all', () => {
  const markdown = buildReadmeMarkdown({ skills: ['nope'] }, { origin: ORIGIN });
  assert.equal(markdown, '');
});

test('buildReadmeMarkdown: visitor counter only appears when opted in with a username', () => {
  const withoutUsername = buildReadmeMarkdown({ showVisitorCounter: true }, { origin: ORIGIN });
  assert.doesNotMatch(withoutUsername, /api\/visitor-count/);

  const optedOut = buildReadmeMarkdown({ username: 'awahids' }, { origin: ORIGIN });
  assert.doesNotMatch(optedOut, /api\/visitor-count/);

  const optedIn = buildReadmeMarkdown({ username: 'awahids', showVisitorCounter: true }, { origin: ORIGIN });
  assert.match(optedIn, /api\/visitor-count\?username=awahids/);
});

test('buildReadmeMarkdown: renders one combined stars badge for every pinned repo', () => {
  const markdown = buildReadmeMarkdown(
    { username: 'awahids', pinnedRepos: ['belajar-ngaji', 'aw-prd', ''] },
    { origin: ORIGIN }
  );
  const badgeCount = (markdown.match(/api\/github\/stars-badge/g) || []).length;
  assert.equal(badgeCount, 1);
  assert.match(markdown, /username=awahids/);
  assert.match(markdown, /repos=belajar-ngaji%2Caw-prd/);
});
