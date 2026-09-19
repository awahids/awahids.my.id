import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

// ponytail: fixed 90-day window for readability instead of the full
// ~365-day calendar. Upgrade path: make it a `days` query param if a
// longer/shorter window is ever needed.
const WINDOW_DAYS = 90;
const CHART_LEFT = 30;
const CHART_RIGHT = 30;
const CHART_TOP = 45;
const CHART_BOTTOM = 30;

const formatShortDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const buildActivityGraphCard = (data, { colors, hideBorder }) => {
  const width = 720;
  const height = 220;
  const chartWidth = width - CHART_LEFT - CHART_RIGHT;
  const chartHeight = height - CHART_TOP - CHART_BOTTOM;

  const sorted = [...data.contributionCalendar].sort((a, b) => a.date.localeCompare(b.date));
  const days = sorted.slice(-WINDOW_DAYS);
  const maxCount = Math.max(1, ...days.map((day) => day.contributionCount));

  const points = days.map((day, index) => {
    const x = CHART_LEFT + (index / Math.max(1, days.length - 1)) * chartWidth;
    const y = CHART_TOP + chartHeight - (day.contributionCount / maxCount) * chartHeight;
    return { x, y, day };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');

  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${CHART_TOP + chartHeight} L${points[0].x.toFixed(1)},${CHART_TOP + chartHeight} Z`
    : '';

  const firstLabel = days[0] ? formatShortDate(days[0].date) : '';
  const lastLabel = days[days.length - 1] ? formatShortDate(days[days.length - 1].date) : '';
  const totalInWindow = days.reduce((sum, day) => sum + day.contributionCount, 0);

  const body = `
    <text x="${width - 25}" y="30" text-anchor="end" font-size="12" fill="#${colors.icon}">${totalInWindow.toLocaleString('en-US')} contributions (last ${WINDOW_DAYS}d)</text>
    <path d="${areaPath}" fill="#${colors.title}" opacity="0.15" />
    <path d="${linePath}" fill="none" stroke="#${colors.title}" stroke-width="2" />
    <text x="${CHART_LEFT}" y="${height - 10}" font-size="11" fill="#${colors.text}">${escapeXml(firstLabel)}</text>
    <text x="${width - CHART_RIGHT}" y="${height - 10}" text-anchor="end" font-size="11" fill="#${colors.text}">${escapeXml(lastLabel)}</text>
  `;

  return renderCard({
    width,
    height,
    title: null,
    colors,
    hideBorder,
    body,
  });
};

export default (req, res) => handleGithubCardRequest(req, res, buildActivityGraphCard);
