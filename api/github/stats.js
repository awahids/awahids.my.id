import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

// Same model as github-readme-stats (MIT): each metric is squashed through a
// CDF around a "typical" value, then combined by weight. A lower percentile
// is better, and S is reserved for the top 1%.
const exponentialCdf = (x) => 1 - 2 ** -x;
const logNormalCdf = (x) => x / (1 + x);

const LEVELS = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];

export const computeRank = ({ commits = 0, pullRequests = 0, issues = 0, reviews = 0, stars = 0, followers = 0 }) => {
  const rank =
    1 -
    (2 * exponentialCdf(commits / 250) +
      3 * exponentialCdf(pullRequests / 50) +
      1 * exponentialCdf(issues / 25) +
      1 * exponentialCdf(reviews / 2) +
      4 * logNormalCdf(stars / 50) +
      1 * logNormalCdf(followers / 10)) /
      12;

  const percentile = rank * 100;
  return { level: LEVELS[THRESHOLDS.findIndex((limit) => percentile <= limit)], percentile };
};

const STAT_ROWS = [
  { key: 'stars', label: 'Total Stars' },
  { key: 'commits', label: 'Commits (12 mo)' },
  { key: 'pullRequests', label: 'PRs (12 mo)' },
  { key: 'issues', label: 'Issues (12 mo)' },
  { key: 'reviews', label: 'Reviews (12 mo)' },
];

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const buildStatsCard = (data, { colors, hideBorder }) => {
  const width = 495;
  const height = 195;
  const { level, percentile } = computeRank(data.totals);
  const ringOffset = RING_CIRCUMFERENCE * (percentile / 100);
  const ringCx = 405;
  const ringCy = 106;

  const rows = STAT_ROWS.map(
    (row, index) => `
      <text x="25" y="${74 + index * 26}" font-size="15" fill="#${colors.icon}">${escapeXml(row.label)}</text>
      <text x="225" y="${74 + index * 26}" font-size="15" font-weight="700" fill="#${colors.text}">${data.totals[row.key].toLocaleString('en-US')}</text>
    `
  ).join('');

  const body = `
    ${rows}
    <circle cx="${ringCx}" cy="${ringCy}" r="${RING_RADIUS}" fill="none" stroke="#${colors.border}" stroke-width="9" />
    <circle cx="${ringCx}" cy="${ringCy}" r="${RING_RADIUS}" fill="none" stroke="#${colors.title}" stroke-width="9"
      stroke-linecap="round" stroke-dasharray="${RING_CIRCUMFERENCE}" stroke-dashoffset="${ringOffset}"
      transform="rotate(-90 ${ringCx} ${ringCy})" />
    <text x="${ringCx}" y="${ringCy + 11}" text-anchor="middle" font-size="32" font-weight="700" fill="#${colors.text}">${escapeXml(level)}</text>
    <text x="${ringCx}" y="${ringCy + RING_RADIUS + 26}" text-anchor="middle" font-size="13" fill="#${colors.icon}">Top ${Math.max(1, Math.round(percentile))}%</text>
  `;

  return renderCard({
    width,
    height,
    title: `${data.profile.name}'s GitHub Stats`,
    colors,
    hideBorder,
    body,
  });
};

export default (req, res) => handleGithubCardRequest(req, res, buildStatsCard);
