import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

// Lowest value that earns each tier, in TIERS order. Below the first one the
// trophy shows as locked. Contribution counts cover the last 12 months, like
// the stats card; repos stop at 100 because the profile query does.
export const TIERS = ['C', 'B', 'A', 'AA', 'AAA', 'S'];

export const TROPHIES = [
  { key: 'stars', label: 'Stars', thresholds: [1, 10, 30, 100, 300, 1000] },
  { key: 'commits', label: 'Commits', thresholds: [10, 50, 100, 500, 1000, 2000] },
  { key: 'pullRequests', label: 'Pull Requests', thresholds: [1, 10, 25, 50, 100, 250] },
  { key: 'reviews', label: 'Reviews', thresholds: [1, 10, 25, 50, 100, 250] },
  { key: 'followers', label: 'Followers', thresholds: [1, 10, 25, 50, 100, 500] },
  { key: 'repos', label: 'Repositories', thresholds: [1, 5, 10, 20, 50, 100] },
];

// Bronze for the first two tiers, silver for the middle, gold for the top.
const TIER_METAL = { C: 'cd7f32', B: 'cd7f32', A: 'b8bcc4', AA: 'b8bcc4', AAA: 'e5b80b', S: 'e5b80b' };

const TILE_WIDTH = 115;
const TILE_HEIGHT = 120;
const TILE_GAP = 10;
const PADDING = 15;

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** Each trophy with its value and earned tier (null while still locked). */
export const computeTrophies = (totals = {}) =>
  TROPHIES.map(({ key, label, thresholds }) => {
    const value = Number(totals[key]) || 0;
    const earned = thresholds.filter((min) => value >= min).length;
    return { key, label, value, tier: earned ? TIERS[earned - 1] : null };
  });

// A cup drawn on a 24x24 grid, so no glyph depends on the viewer's fonts.
const cupIcon = (cx, top, color) => `
  <g transform="translate(${cx - 18} ${top}) scale(1.5)" stroke="#${color}" stroke-width="1.4" stroke-linejoin="round">
    <path d="M6 3h12v5a6 6 0 0 1-12 0z" fill="#${color}" />
    <path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M12 14v3" fill="none" />
    <path d="M8.5 21h7l-1-4h-5z" fill="#${color}" />
  </g>`;

const buildTrophyTile = (trophy, index, colors) => {
  const x = PADDING + index * (TILE_WIDTH + TILE_GAP);
  const cx = x + TILE_WIDTH / 2;
  const locked = !trophy.tier;
  const metal = locked ? colors.border : TIER_METAL[trophy.tier];

  return `
    <rect x="${x}" y="${PADDING}" width="${TILE_WIDTH}" height="${TILE_HEIGHT}" rx="6" fill="none" stroke="#${colors.border}" />
    ${cupIcon(cx, PADDING + 10, metal)}
    <text x="${cx}" y="${PADDING + 72}" text-anchor="middle" font-size="18" font-weight="700" fill="#${locked ? colors.border : colors.title}">${locked ? '–' : trophy.tier}</text>
    <text x="${cx}" y="${PADDING + 92}" text-anchor="middle" font-size="12" fill="#${colors.text}">${escapeXml(trophy.label)}</text>
    <text x="${cx}" y="${PADDING + 109}" text-anchor="middle" font-size="11" fill="#${colors.icon}">${escapeXml(compactNumber.format(trophy.value))}</text>
  `;
};

// One row of tiles, about as wide as the stats and top-langs cards side by side.
export const buildTrophiesCard = (data, { colors, hideBorder }) => {
  const trophies = computeTrophies(data.totals);
  return renderCard({
    width: PADDING * 2 + trophies.length * TILE_WIDTH + (trophies.length - 1) * TILE_GAP,
    height: TILE_HEIGHT + PADDING * 2,
    colors,
    hideBorder,
    body: trophies.map((trophy, index) => buildTrophyTile(trophy, index, colors)).join(''),
  });
};

export default (req, res) => handleGithubCardRequest(req, res, buildTrophiesCard);
