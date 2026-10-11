import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getGithubProfileData, getCombinedRepoStars } from './github.js';

const repoNode = (name, stars, languages) => ({
  name,
  stargazerCount: stars,
  forkCount: 0,
  primaryLanguage: languages[0] ? { name: languages[0][0], color: '#fff' } : null,
  languages: {
    edges: languages.map(([langName, size]) => ({ size, node: { name: langName, color: '#fff' } })),
  },
});

const userPayload = (repos, { hasNextPage = false, endCursor = null } = {}) => ({
  data: {
    user: {
      name: 'Wahid',
      login: 'awahids',
      avatarUrl: 'https://example.com/a.png',
      repositories: {
        pageInfo: { hasNextPage, endCursor },
        nodes: repos,
      },
      contributionsCollection: {
        totalCommitContributions: 10,
        totalPullRequestContributions: 2,
        totalIssueContributions: 1,
        totalPullRequestReviewContributions: 0,
        contributionCalendar: {
          totalContributions: 13,
          weeks: [{ contributionDays: [{ date: '2026-01-01', contributionCount: 3 }] }],
        },
      },
    },
  },
});

test('aggregates stars, languages and contribution days across paginated repos', async (t) => {
  process.env.GITHUB_TOKEN = 'test-token';
  let call = 0;
  t.mock.method(global, 'fetch', async () => {
    call += 1;
    const body =
      call === 1
        ? userPayload([repoNode('a', 5, [['JS', 100]])], { hasNextPage: true, endCursor: 'c1' })
        : userPayload([repoNode('b', 7, [['JS', 50], ['Go', 200]])]);
    return { status: 200, headers: new Map(), json: async () => body };
  });

  const result = await getGithubProfileData('awahids');

  assert.equal(result.totals.stars, 12);
  assert.equal(result.totals.repos, 2);
  assert.equal(result.languages[0].name, 'Go');
  assert.equal(result.languages[0].size, 200);
  assert.deepEqual(result.contributionCalendar, [{ date: '2026-01-01', contributionCount: 3 }]);
  assert.equal(call, 2);
});

test('maps a NOT_FOUND GraphQL error to a 404 GithubServiceError', async (t) => {
  process.env.GITHUB_TOKEN = 'test-token';
  t.mock.method(global, 'fetch', async () => ({
    status: 200,
    headers: new Map(),
    json: async () => ({ errors: [{ type: 'NOT_FOUND', message: 'Could not resolve to a User' }] }),
  }));

  await assert.rejects(() => getGithubProfileData('does-not-exist'), (error) => {
    assert.equal(error.code, 'NOT_FOUND');
    assert.equal(error.status, 404);
    return true;
  });
});

test('getCombinedRepoStars: sums stars across repos and treats a 404 repo as 0', async (t) => {
  process.env.GITHUB_TOKEN = 'test-token';
  t.mock.method(global, 'fetch', async (url) => {
    if (String(url).endsWith('/repos/awahids/belajar-ngaji')) {
      return { ok: true, json: async () => ({ stargazers_count: 40 }) };
    }
    if (String(url).endsWith('/repos/awahids/aw-prd')) {
      return { ok: true, json: async () => ({ stargazers_count: 12 }) };
    }
    return { ok: false, status: 404 };
  });

  const total = await getCombinedRepoStars('awahids', ['belajar-ngaji', 'aw-prd', 'missing-repo']);
  assert.equal(total, 52);
});
