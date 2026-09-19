import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

const RANK_WEIGHTS = { stars: 2, commits: 1, prs: 3, issues: 1, reviews: 3 };

// ponytail: local heuristic, not the real GitHub-wide percentile rank from
// github-readme-stats. Upgrade path: swap for real percentile data if we
// ever get access to a stats distribution to compare against.
export const computeRank = (totals) => {
  const rawScore =
    totals.stars * RANK_WEIGHTS.stars +
    totals.commits * RANK_WEIGHTS.commits +
    totals.pullRequests * RANK_WEIGHTS.prs +
    totals.issues * RANK_WEIGHTS.issues +
    totals.reviews * RANK_WEIGHTS.reviews;

  const score = Math.round(100 * (1 - Math.exp(-rawScore / 300)));

  const grade =
    score >= 90 ? 'S' :
    score >= 80 ? 'A+' :
    score >= 65 ? 'A' :
    score >= 45 ? 'B+' :
    score >= 30 ? 'B' :
    score >= 15 ? 'C+' : 'C';

  return { score, grade };
};

const STAT_ROWS = [
  { key: 'stars', label: 'Total Stars' },
  { key: 'commits', label: 'Total Commits' },
  { key: 'pullRequests', label: 'Total PRs' },
  { key: 'issues', label: 'Total Issues' },
  { key: 'reviews', label: 'Total Reviews' },
];

const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const buildStatsCard = (data, { colors, hideBorder }) => {
  const width = 480;
  const height = 40 + STAT_ROWS.length * 30 + 20;
  const { score, grade } = computeRank(data.totals);
  const ringOffset = RING_CIRCUMFERENCE * (1 - score / 100);
  const ringCx = width - 90;
  const ringCy = height / 2 + 5;

  const rows = STAT_ROWS.map(
    (row, index) => `
      <text x="25" y="${70 + index * 30}" font-size="14" fill="#${colors.icon}">${escapeXml(row.label)}:</text>
      <text x="220" y="${70 + index * 30}" font-size="14" font-weight="600" fill="#${colors.text}">${data.totals[row.key].toLocaleString('en-US')}</text>
    `
  ).join('');

  const body = `
    ${rows}
    <circle cx="${ringCx}" cy="${ringCy}" r="${RING_RADIUS}" fill="none" stroke="#${colors.border}" stroke-width="6" />
    <circle cx="${ringCx}" cy="${ringCy}" r="${RING_RADIUS}" fill="none" stroke="#${colors.title}" stroke-width="6"
      stroke-linecap="round" stroke-dasharray="${RING_CIRCUMFERENCE}" stroke-dashoffset="${ringOffset}"
      transform="rotate(-90 ${ringCx} ${ringCy})" />
    <text x="${ringCx}" y="${ringCy + 7}" text-anchor="middle" font-size="22" font-weight="700" fill="#${colors.text}">${grade}</text>
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
