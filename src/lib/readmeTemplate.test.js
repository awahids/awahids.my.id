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

test('buildReadmeMarkdown: a non-default theme is passed to every card and the typing header', () => {
  const markdown = buildReadmeMarkdown({ username: 'awahids', taglineLines: ['Hi'], theme: 'dracula' }, { origin: ORIGIN });
  for (const path of ['streak', 'stats', 'top-langs', 'activity-graph']) {
    assert.match(markdown, new RegExp(`api/github/${path}\\?username=awahids&theme=dracula`));
  }
  assert.match(markdown, /api\/typing\?[^"]*theme=dracula/);
});

test('buildReadmeMarkdown: default or unknown theme adds no theme param', () => {
  for (const theme of ['default', 'nope', undefined]) {
    assert.doesNotMatch(buildReadmeMarkdown({ username: 'a', theme }, { origin: ORIGIN }), /theme=/);
  }
});

test('buildReadmeMarkdown: typing options map to query params and ignore invalid values', () => {
  const md = buildReadmeMarkdown(
    { taglineLines: ['Hi'], typing: { font: 'serif', bold: true, speed: 'fast', align: 'right', size: 24, color: 'ff0000' } },
    { origin: ORIGIN }
  );
  assert.match(md, /font=serif/);
  assert.match(md, /weight=bold/);
  assert.match(md, /speed=fast/);
  assert.match(md, /align=right/);
  assert.match(md, /size=24/);
  assert.match(md, /color=ff0000/);
  const bad = buildReadmeMarkdown({ taglineLines: ['Hi'], typing: { font: 'x', speed: 'x', color: 'zzz' } }, { origin: ORIGIN });
  assert.doesNotMatch(bad, /font=|speed=|color=|weight=/);
});

test('buildReadmeMarkdown: lines-of-code section only appears when opted in, with one marker pair', () => {
  assert.doesNotMatch(buildReadmeMarkdown({ username: 'awahids' }, { origin: ORIGIN }), /PUBLIC CODE STATS/);

  const markdown = buildReadmeMarkdown({ username: 'awahids', showCodeStats: true }, { origin: ORIGIN });
  assert.equal((markdown.match(/<!-- PUBLIC CODE STATS START -->/g) || []).length, 1);
  assert.equal((markdown.match(/<!-- PUBLIC CODE STATS END -->/g) || []).length, 1);
  assert.ok(markdown.indexOf('START -->') < markdown.indexOf('END -->'));
  assert.ok(markdown.indexOf('api/github/activity-graph') < markdown.indexOf('PUBLIC CODE STATS START'));
});

test('buildReadmeMarkdown: a light-mode theme wraps every card in a <picture> with both themes', () => {
  const markdown = buildReadmeMarkdown(
    { username: 'awahids', taglineLines: ['Hi'], theme: 'dracula', lightTheme: 'light' },
    { origin: ORIGIN }
  );
  for (const path of ['/api/typing', '/api/github/streak', '/api/github/stats', '/api/github/top-langs', '/api/github/activity-graph']) {
    const escaped = path.replace(/\//g, '\\/');
    assert.match(
      markdown,
      new RegExp(`<picture><source media="\\(prefers-color-scheme: light\\)" srcset="[^"]*${escaped}\\?[^"]*theme=light" /><img src="[^"]*${escaped}\\?[^"]*theme=dracula"`),
      path
    );
  }
  assert.equal((markdown.match(/<picture>/g) || []).length, 5);
});

test('buildReadmeMarkdown: a light-mode theme that matches the main theme (or is unknown) adds no <picture>', () => {
  for (const lightTheme of ['dracula', 'nope', '']) {
    const markdown = buildReadmeMarkdown({ username: 'a', theme: 'dracula', lightTheme }, { origin: ORIGIN });
    assert.doesNotMatch(markdown, /<picture>/, lightTheme);
  }
});

test('buildReadmeMarkdown: the default theme can be the light-mode side (no theme param there)', () => {
  const markdown = buildReadmeMarkdown({ username: 'a', theme: 'dracula', lightTheme: 'default' }, { origin: ORIGIN });
  assert.match(markdown, /srcset="[^"]*api\/github\/stats\?username=a" \/><img src="[^"]*api\/github\/stats\?username=a&theme=dracula"/);
});

test('buildReadmeMarkdown: repo cards link each valid pinned repo, only when opted in', () => {
  const values = { username: 'awahids', pinnedRepos: ['belajar-ngaji', 'bad"name', 'aw-prd'] };
  assert.doesNotMatch(buildReadmeMarkdown(values, { origin: ORIGIN }), /repo-card/);

  const markdown = buildReadmeMarkdown({ ...values, showRepoCards: true, theme: 'nord' }, { origin: ORIGIN });
  assert.match(markdown, /<a href="https:\/\/github\.com\/awahids\/belajar-ngaji"><img src="https:\/\/awahids\.my\.id\/api\/github\/repo-card\?username=awahids&repo=belajar-ngaji&theme=nord" \/><\/a>/);
  assert.match(markdown, /repo=aw-prd/);
  assert.doesNotMatch(markdown, /repo=bad|github\.com\/awahids\/bad/);
  assert.ok(markdown.indexOf('Pinned Repositories') < markdown.indexOf('⚡ Stats ⚡'));
});

test('buildReadmeMarkdown: repo cards need a valid username', () => {
  const markdown = buildReadmeMarkdown(
    { username: 'not valid', pinnedRepos: ['x'], showRepoCards: true },
    { origin: ORIGIN }
  );
  assert.doesNotMatch(markdown, /repo-card/);
});

test('buildReadmeMarkdown: the snake uses both palettes from the output branch, only when opted in', () => {
  assert.doesNotMatch(buildReadmeMarkdown({ username: 'awahids' }, { origin: ORIGIN }), /github-snake/);
  assert.doesNotMatch(buildReadmeMarkdown({ username: 'a"b', showSnake: true }, { origin: ORIGIN }), /github-snake/);

  const markdown = buildReadmeMarkdown({ username: 'awahids', showSnake: true }, { origin: ORIGIN });
  assert.match(markdown, /media="\(prefers-color-scheme: dark\)" srcset="https:\/\/raw\.githubusercontent\.com\/awahids\/awahids\/output\/github-snake-dark\.svg"/);
  assert.match(markdown, /<img alt="[^"]+" src="https:\/\/raw\.githubusercontent\.com\/awahids\/awahids\/output\/github-snake\.svg"/);
});

test('buildReadmeMarkdown: the trophy row opens the stats section only when opted in, and follows the themes', () => {
  assert.doesNotMatch(buildReadmeMarkdown({ username: 'awahids' }, { origin: ORIGIN }), /api\/github\/trophies/);

  const markdown = buildReadmeMarkdown(
    { username: 'awahids', showTrophies: true, theme: 'nord', lightTheme: 'light' },
    { origin: ORIGIN }
  );
  assert.match(markdown, /srcset="[^"]*api\/github\/trophies\?username=awahids&theme=light" \/><img src="[^"]*api\/github\/trophies\?username=awahids&theme=nord"/);
  assert.ok(markdown.indexOf('api/github/trophies') < markdown.indexOf('api/github/streak'));
  assert.ok(markdown.indexOf('⚡ Stats ⚡') < markdown.indexOf('api/github/trophies'));
});
