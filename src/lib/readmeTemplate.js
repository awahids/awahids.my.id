import { DEFAULT_THEME, isCardTheme } from './cardThemes.js';
import { isSkillIcon, skillIconsBannerUrl } from './skillIcons.js';
import { CODE_STATS_END, CODE_STATS_START } from './codeStatsWorkflow.js';
import { snakeImageUrls } from './snakeWorkflow.js';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[char]);

const buildQuery = (params) => new URLSearchParams(params).toString();

const cardUrl = (origin, path, params) => `${origin}${path}?${buildQuery(params)}`;

const GITHUB_LOGIN = /^[a-zA-Z0-9-]{1,39}$/;
const REPO_NAME = /^[a-zA-Z0-9._-]{1,100}$/;
const MAX_REPO_CARDS = 6;

// Guards against a `javascript:`/`data:` href ending up in the generated
// (and previewed) HTML — only allow the schemes a profile link should need.
const isSafeLinkUrl = (url) => {
  try {
    return ['http:', 'https:', 'mailto:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

/**
 * Builds the GitHub profile README as an HTML-flavored markdown string —
 * the same string is used both as the copyable output and (via
 * dangerouslySetInnerHTML) as the live preview, since the template is
 * already raw HTML like the attached reference README.
 */
export const buildReadmeMarkdown = (values, { origin }) => {
  const username = values.username?.trim() || '';
  const taglineLines = (values.taglineLines || []).filter(Boolean);
  const bioParagraphs = (values.bio || []).filter(Boolean);
  const socialLinks = (values.socialLinks || []).filter(
    (link) => link.label && link.url && isSafeLinkUrl(link.url)
  );
  const skills = (values.skills || []).filter(isSkillIcon);
  const mainTheme = isCardTheme(values.theme) ? values.theme : DEFAULT_THEME;
  // Optional second palette for viewers in light mode; the main one covers the rest.
  const lightTheme = isCardTheme(values.lightTheme) && values.lightTheme !== mainTheme ? values.lightTheme : '';
  const withTheme = (params, name) => (name !== DEFAULT_THEME ? { ...params, theme: name } : params);
  // A self-hosted card image. With a light-mode theme it becomes a <picture>
  // that GitHub swaps on prefers-color-scheme, the same way it does for its
  // own docs images.
  const cardImg = (path, params, attrs = '') => {
    const img = `<img src="${cardUrl(origin, path, withTheme(params, mainTheme))}"${attrs} />`;
    if (!lightTheme) return img;
    return `<picture><source media="(prefers-color-scheme: light)" srcset="${cardUrl(origin, path, withTheme(params, lightTheme))}" />${img}</picture>`;
  };
  const typing = values.typing || {};
  const typingParams = {
    lines: taglineLines.join(';'),
    size: String(typing.size || 30),
    align: ['left', 'right'].includes(typing.align) ? typing.align : 'center',
    ...(['sans', 'serif'].includes(typing.font) && { font: typing.font }),
    ...(typing.bold && { weight: 'bold' }),
    ...(['slow', 'fast'].includes(typing.speed) && { speed: typing.speed }),
    ...(/^[0-9a-f]{6}$/i.test(typing.color || '') && { color: typing.color }),
  };
  const pinnedRepos = (values.pinnedRepos || []).map((repo) => repo.trim()).filter(Boolean);

  const topBadges = [
    // Combined across every pinned repo — shields.io only ever badges one
    // repo at a time, so a summed count needs our own self-hosted endpoint.
    pinnedRepos.length && username
      ? `<img align="right" src="${cardUrl(origin, '/api/github/stars-badge', { username, repos: pinnedRepos.join(',') })}">`
      : '',
    values.showVisitorCounter && username
      ? `<img align="right" src="${cardUrl(origin, '/api/visitor-count', { username })}">`
      : '',
  ].filter(Boolean);

  const starsBadge = topBadges.length ? `${topBadges.join('\n')}\n<br>\n\n` : '';

  const typingHeader = taglineLines.length
    ? `<h1 align="center">
  ${cardImg('/api/typing', typingParams)}
</h1>\n\n`
    : '';

  const socialRow = socialLinks.length
    ? `<h5 align="center">
${socialLinks.map((link) => `  <code><a href="${escapeHtml(link.url)}" title="${escapeHtml(link.label)}">${escapeHtml(link.label)}</a></code>`).join('\n')}
</h5>
<br>\n\n`
    : '';

  const bioSection = bioParagraphs.length
    ? `<p align="center">
  ${bioParagraphs.map(escapeHtml).join('\n  <br>\n  <br>\n  ')}
</p>\n\n`
    : '';

  // skillicons.dev lays the icons out itself (`perline`), so one image is enough.
  // GitHub strips `style=` from README HTML, so a CSS flex row would not survive anyway.
  const skillsSection = skills.length
    ? `<hr>
<h2 align="center">🔥 Languages & Frameworks & Tools & Abilities 🔥</h2>
<br>
<p align="center">
  <img src="${skillIconsBannerUrl(skills)}" alt="Skills" />
</p>\n\n`
    : '';

  // Links go straight into README HTML, so only names GitHub itself allows.
  const repoCards = GITHUB_LOGIN.test(username) && values.showRepoCards
    ? pinnedRepos.filter((repo) => REPO_NAME.test(repo)).slice(0, MAX_REPO_CARDS)
    : [];
  const repoCardsSection = repoCards.length
    ? `<hr>
<h2 align="center">📌 Pinned Repositories 📌</h2>
<br>
<p align="center">
${repoCards.map((repo) => `  <a href="https://github.com/${username}/${repo}">${cardImg('/api/github/repo-card', { username, repo })}</a>`).join('\n')}
</p>\n\n`
    : '';

  const trophiesRow = values.showTrophies ? `${cardImg('/api/github/trophies', { username })}<br>\n  ` : '';

  const statsSection = username
    ? `<hr>
<h2 align="center">⚡ Stats ⚡</h2>
<br>
<p align="center">
  ${trophiesRow}${cardImg('/api/github/streak', { username })}<br>
  ${cardImg('/api/github/stats', { username })}
  ${cardImg('/api/github/top-langs', { username })}
  <br>
  ${cardImg('/api/github/activity-graph', { username }, ' width="100%"')}
</p>\n\n`
    : '';

  // The snake ships its own light and dark SVGs, so it always follows the
  // viewer's color scheme, whatever card themes were picked.
  const snake = values.showSnake ? snakeImageUrls(username) : null;
  const snakeSection = snake
    ? `<hr>
<h2 align="center">🐍 Contribution Snake 🐍</h2>
<br>
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="${snake.dark}" />
    <source media="(prefers-color-scheme: light)" srcset="${snake.light}" />
    <img alt="A snake eating the contribution graph" src="${snake.light}" />
  </picture>
</p>\n\n`
    : '';

  // Only the marker pair matters: the copied workflow replaces everything
  // between them with a cloc table on its first run, placeholder included.
  const codeStatsSection = values.showCodeStats
    ? `<hr>
<h2 align="center">📊 Lines of Code 📊</h2>
<br>

${CODE_STATS_START}
<p align="center"><em>Filled in by the Analyze Public Repositories workflow after its first run.</em></p>
${CODE_STATS_END}\n`
    : '';

  return [
    starsBadge,
    typingHeader,
    socialRow,
    bioSection,
    skillsSection,
    repoCardsSection,
    statsSection,
    snakeSection,
    codeStatsSection,
  ]
    .join('')
    .trim();
};
