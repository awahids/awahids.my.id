import { DEFAULT_THEME, isCardTheme } from './cardThemes.js';
import { isSkillIcon, skillIconsBannerUrl } from './skillIcons.js';

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
  const theme = isCardTheme(values.theme) && values.theme !== DEFAULT_THEME ? values.theme : '';
  const themed = (params) => (theme ? { ...params, theme } : params);
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
  <img src="${cardUrl(origin, '/api/typing', themed(typingParams))}">
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

  const statsSection = username
    ? `<hr>
<h2 align="center">⚡ Stats ⚡</h2>
<br>
<p align="center">
  <img src="${cardUrl(origin, '/api/github/streak', themed({ username }))}" /><br>
  <img src="${cardUrl(origin, '/api/github/stats', themed({ username }))}" />
  <img src="${cardUrl(origin, '/api/github/top-langs', themed({ username }))}" />
  <br>
  <img src="${cardUrl(origin, '/api/github/activity-graph', themed({ username }))}" width="100%"/>
</p>\n`
    : '';

  return [starsBadge, typingHeader, socialRow, bioSection, skillsSection, statsSection]
    .join('')
    .trim();
};
