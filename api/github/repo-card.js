import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { getRepoCardData } from '../_lib/github.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

const REPO_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/;
const FALLBACK_COLOR = '#858585';
const MAX_NAME_LENGTH = 28;
const DESCRIPTION_LINE_CHARS = 52;
const DESCRIPTION_MAX_LINES = 2;
// Rough average glyph width at 13px, used to lay the footer items out in a row.
const FOOTER_CHAR_WIDTH = 7.5;

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Greedy word wrap by character count (SVG text has no wrapping of its own).
 * A word longer than a line is cut, and text past the last line ends in "…".
 */
export const wrapDescription = (text, lineChars = DESCRIPTION_LINE_CHARS, maxLines = DESCRIPTION_MAX_LINES) => {
  const lines = [''];
  let overflow = false;

  for (const word of String(text || '').split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    const candidate = last ? `${last} ${word}` : word;
    if (candidate.length <= lineChars) {
      lines[lines.length - 1] = candidate;
    } else if (!last) {
      lines[lines.length - 1] = truncate(word, lineChars);
    } else if (lines.length === maxLines) {
      overflow = true;
      break;
    } else {
      lines.push(truncate(word, lineChars));
    }
  }

  if (overflow) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.length < lineChars ? `${last}…` : `${last.slice(0, lineChars - 1)}…`;
  }
  return lines.filter(Boolean);
};

const forkIcon = (x, color) => `
  <g transform="translate(${x} 92)" fill="none" stroke="#${color}" stroke-width="1.5">
    <circle cx="3" cy="2.5" r="2" /><circle cx="11" cy="2.5" r="2" /><circle cx="7" cy="13.5" r="2" />
    <path d="M3 4.5v1.5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4.5M7 8v3.5" />
  </g>`;

// 400x120 so two cards sit side by side in a README, like GitHub's own pins.
export const buildRepoCard = (repo, { colors, hideBorder }) => {
  const description = wrapDescription(repo.description || 'No description provided');
  const descriptionRows = description
    .map((line, index) => `<text x="25" y="${62 + index * 18}" font-size="13" fill="#${colors.text}">${escapeXml(line)}</text>`)
    .join('');

  const footer = [];
  let x = 25;
  if (repo.primaryLanguage?.name) {
    const color = repo.primaryLanguage.color || FALLBACK_COLOR;
    footer.push(`<circle cx="${x + 6}" cy="100" r="6" fill="${escapeXml(color)}" />`);
    footer.push(`<text x="${x + 18}" y="105" font-size="13" fill="#${colors.text}">${escapeXml(repo.primaryLanguage.name)}</text>`);
    x += 18 + repo.primaryLanguage.name.length * FOOTER_CHAR_WIDTH + 20;
  }
  const stars = `★ ${compactNumber.format(repo.stargazerCount || 0)}`;
  footer.push(`<text x="${x}" y="105" font-size="13" fill="#${colors.text}"><tspan fill="#${colors.icon}">★</tspan>${escapeXml(stars.slice(1))}</text>`);
  x += stars.length * FOOTER_CHAR_WIDTH + 20;
  footer.push(forkIcon(x, colors.icon));
  footer.push(`<text x="${x + 20}" y="105" font-size="13" fill="#${colors.text}">${escapeXml(compactNumber.format(repo.forkCount || 0))}</text>`);

  const archived = repo.isArchived
    ? `<text x="375" y="33" text-anchor="end" font-size="12" fill="#${colors.icon}">Archived</text>`
    : '';

  return renderCard({
    width: 400,
    height: 120,
    title: truncate(repo.name, MAX_NAME_LENGTH),
    colors,
    hideBorder,
    body: `${archived}${descriptionRows}${footer.join('')}`,
  });
};

const fetchRepoCard = (username, query) => {
  const repo = String(query.repo || '').trim();
  if (!REPO_PATTERN.test(repo)) {
    return Promise.reject(Object.assign(new Error('Invalid or missing "repo" query param'), { status: 400 }));
  }
  return getRepoCardData(username, repo);
};

export default (req, res) => handleGithubCardRequest(req, res, buildRepoCard, { fetchData: fetchRepoCard });
