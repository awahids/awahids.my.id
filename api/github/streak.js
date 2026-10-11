import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

// ponytail: only tolerates a single trailing zero-contribution day (assumed
// to be "today, not over yet"). Doesn't handle timezone edge cases around
// midnight. Upgrade path: pass the viewer's timezone if this ever matters.
export const computeStreakStats = (days) => {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let longestStart = null;
  let longestEnd = null;
  let streak = 0;
  let streakStart = null;
  for (const day of sorted) {
    if (day.contributionCount > 0) {
      if (streak === 0) streakStart = day.date;
      streak += 1;
      if (streak > longest) {
        longest = streak;
        longestStart = streakStart;
        longestEnd = day.date;
      }
    } else {
      streak = 0;
    }
  }

  let current = 0;
  let currentStart = null;
  let currentEnd = null;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const day = sorted[i];
    const isTrailingDay = i === sorted.length - 1;
    if (day.contributionCount > 0) {
      current += 1;
      currentStart = day.date;
      currentEnd = currentEnd || day.date;
    } else if (isTrailingDay) {
      continue;
    } else {
      break;
    }
  }

  const total = sorted.reduce((sum, day) => sum + day.contributionCount, 0);

  return {
    total,
    current,
    currentStart,
    currentEnd,
    longest,
    longestStart,
    longestEnd,
    firstDate: sorted[0]?.date || null,
    lastDate: sorted[sorted.length - 1]?.date || null,
  };
};

const formatDate = (isoDate) => {
  if (!isoDate) return '-';
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

// Range shown under a streak: "Sep 14 - Sep 24" (year only when it differs).
export const formatRange = (start, end) => {
  if (!start || !end) return 'No streak yet';
  if (start === end) return formatDate(start);
  const short = (iso) => formatDate(iso).replace(/, \d{4}$/, '');
  return start.slice(0, 4) === end.slice(0, 4)
    ? `${short(start)} - ${short(end)}`
    : `${formatDate(start)} - ${formatDate(end)}`;
};

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_GAP = 46; // arc length left open at the top for the flame

// Simple flame, drawn in a 24x24 box and scaled up around the ring's top.
const FLAME_PATH =
  'M12 1.5c.5 3.2-1.4 4.6-2.9 6.5C7.6 9.9 6.5 11.8 6.5 14.2 6.5 18 9 21 12 21s5.5-3 5.5-6.8c0-2-.9-3.5-2-4.7-.3 1.1-.9 1.8-1.7 2.3.5-3-.4-6.4-2.3-10.3z';

const buildStreakCard = (data, { colors, hideBorder }) => {
  const width = 495;
  const height = 195;
  const stats = computeStreakStats(data.contributionCalendar);

  const ringCx = 247;
  const ringCy = 88;
  const ringRotation = -90 + (RING_GAP / RING_CIRCUMFERENCE) * 180;

  const columns = [
    {
      x: 82,
      value: stats.total.toLocaleString('en-US'),
      label: 'Total contributions',
      note: `${formatDate(stats.firstDate)} - Present`,
    },
    { x: 247, value: String(stats.current), label: 'Current streak', note: formatRange(stats.currentStart, stats.currentEnd), ring: true },
    { x: 412, value: String(stats.longest), label: 'Longest streak', note: formatRange(stats.longestStart, stats.longestEnd) },
  ];

  const dividers = [165, 330]
    .map((x) => `<line x1="${x}" y1="42" x2="${x}" y2="160" stroke="#${colors.border}" stroke-width="1" />`)
    .join('');

  const ring = `
    <circle cx="${ringCx}" cy="${ringCy}" r="${RING_RADIUS}" fill="none" stroke="#${colors.title}" stroke-width="6"
      stroke-linecap="round" stroke-dasharray="${RING_CIRCUMFERENCE - RING_GAP} ${RING_GAP}"
      transform="rotate(${ringRotation.toFixed(2)} ${ringCx} ${ringCy})" />
    <g transform="translate(${ringCx - 19} ${ringCy - RING_RADIUS - 27}) scale(1.6)">
      <path d="${FLAME_PATH}" fill="#${colors.title}" />
    </g>`;

  const body = dividers + ring + columns.map((col) => `
    <text x="${col.x}" y="${col.ring ? ringCy + 13 : 100}" text-anchor="middle" font-size="36" font-weight="700" fill="#${col.ring ? colors.title : colors.text}">${escapeXml(col.value)}</text>
    <text x="${col.x}" y="152" text-anchor="middle" font-size="15" font-weight="600" fill="#${colors.icon}">${escapeXml(col.label)}</text>
    <text x="${col.x}" y="174" text-anchor="middle" font-size="12" fill="#${colors.text}" fill-opacity="0.65">${escapeXml(col.note)}</text>
  `).join('');

  return renderCard({ width, height, title: '', colors, hideBorder, body });
};

export default (req, res) => handleGithubCardRequest(req, res, buildStreakCard);
