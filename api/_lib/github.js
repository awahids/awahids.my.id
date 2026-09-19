const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_REPOS = 100;

const PROFILE_QUERY = `
  query GithubProfileData($login: String!, $reposCursor: String) {
    user(login: $login) {
      name
      login
      avatarUrl
      repositories(
        first: 100
        after: $reposCursor
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

const createGithubError = ({ status = 500, code = 'UPSTREAM_ERROR', message }) =>
  Object.assign(new Error(message), { name: 'GithubServiceError', status, code });

const fetchGraphqlPage = async (login, reposCursor, timeoutMs) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw createGithubError({
      status: 500,
      code: 'CONFIG_MISSING',
      message: 'GITHUB_TOKEN is missing',
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: PROFILE_QUERY, variables: { login, reposCursor } }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createGithubError({
        status: 504,
        code: 'TIMEOUT',
        message: `GitHub GraphQL request timed out after ${timeoutMs}ms`,
      });
    }
    throw createGithubError({
      status: 502,
      code: 'UPSTREAM_ERROR',
      message: `GitHub GraphQL request failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    const isRateLimited = response.headers.get('x-ratelimit-remaining') === '0';
    throw createGithubError({
      status: isRateLimited ? 429 : 401,
      code: isRateLimited ? 'RATE_LIMITED' : 'CONFIG_INVALID',
      message: isRateLimited ? 'GitHub API rate limit exceeded' : 'GitHub token is invalid',
    });
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    const notFound = payload.errors.some((error) => error.type === 'NOT_FOUND');
    throw createGithubError({
      status: notFound ? 404 : 502,
      code: notFound ? 'NOT_FOUND' : 'UPSTREAM_ERROR',
      message: payload.errors.map((error) => error.message).join('; '),
    });
  }

  if (!payload.data?.user) {
    throw createGithubError({ status: 404, code: 'NOT_FOUND', message: `GitHub user "${login}" not found` });
  }

  return payload.data.user;
};

const mergeLanguageTotals = (languageTotals, repo) => {
  for (const edge of repo.languages?.edges || []) {
    const name = edge.node?.name;
    if (!name) continue;
    const existing = languageTotals.get(name) || { name, color: edge.node.color, size: 0 };
    existing.size += edge.size || 0;
    languageTotals.set(name, existing);
  }
};

/**
 * Fetches and normalizes everything the stats/top-langs/streak/activity
 * cards need from a single GitHub GraphQL round trip (paginated over repos
 * when a user has more than 100).
 */
export const getGithubProfileData = async (username, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const login = String(username || '').trim();
  if (!login) {
    throw createGithubError({ status: 400, code: 'INVALID_USERNAME', message: 'username is required' });
  }

  const languageTotals = new Map();
  let totalStars = 0;
  let totalForks = 0;
  let user;
  let reposCursor;
  let repoCount = 0;

  do {
    user = await fetchGraphqlPage(login, reposCursor, timeoutMs);
    for (const repo of user.repositories.nodes) {
      totalStars += repo.stargazerCount || 0;
      totalForks += repo.forkCount || 0;
      mergeLanguageTotals(languageTotals, repo);
    }
    repoCount += user.repositories.nodes.length;
    reposCursor = user.repositories.pageInfo.hasNextPage ? user.repositories.pageInfo.endCursor : null;
  } while (reposCursor && repoCount < MAX_REPOS);

  const calendar = user.contributionsCollection.contributionCalendar;
  const contributionDays = calendar.weeks.flatMap((week) => week.contributionDays);

  return {
    profile: {
      name: user.name || user.login,
      login: user.login,
      avatarUrl: user.avatarUrl,
    },
    totals: {
      stars: totalStars,
      forks: totalForks,
      repos: repoCount,
      commits: user.contributionsCollection.totalCommitContributions,
      pullRequests: user.contributionsCollection.totalPullRequestContributions,
      issues: user.contributionsCollection.totalIssueContributions,
      reviews: user.contributionsCollection.totalPullRequestReviewContributions,
      contributions: calendar.totalContributions,
    },
    languages: [...languageTotals.values()].sort((a, b) => b.size - a.size),
    contributionCalendar: contributionDays,
  };
};

const GITHUB_REST_URL = 'https://api.github.com';

/**
 * Sums stargazer counts across a handful of named repos (for a "combined
 * stars" badge) — a repo that 404s or errors contributes 0 rather than
 * failing the whole request, since this is decorative.
 */
export const getCombinedRepoStars = async (username, repoNames, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw createGithubError({ status: 500, code: 'CONFIG_MISSING', message: 'GITHUB_TOKEN is missing' });
  }

  const counts = await Promise.all(
    repoNames.map(async (repo) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${GITHUB_REST_URL}/repos/${username}/${repo}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });
        if (!response.ok) return 0;
        const data = await response.json();
        return data.stargazers_count || 0;
      } catch {
        return 0;
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  return counts.reduce((sum, count) => sum + count, 0);
};
