import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

// ponytail: only tolerates a single trailing zero-contribution day (assumed
// to be "today, not over yet"). Doesn't handle timezone edge cases around
// midnight. Upgrade path: pass the viewer's timezone if this ever matters.
export const computeStreakStats = (days) => {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let streak = 0;
  for (const day of sorted) {
    streak = day.contributionCount > 0 ? streak + 1 : 0;
    if (streak > longest) longest = streak;
  }

  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const day = sorted[i];
    const isTrailingDay = i === sorted.length - 1;
    if (day.contributionCount > 0) {
      current += 1;
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
    longest,
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
  });
};

const buildStreakCard = (data, { colors, hideBorder }) => {
  const width = 480;
  const height = 150;
  const stats = computeStreakStats(data.contributionCalendar);

  const columns = [
    { value: stats.total.toLocaleString('en-US'), label: `${formatDate(stats.firstDate)} - Present`, x: 90 },
    { value: String(stats.current), label: 'Current Streak', x: 240, highlight: true },
    { value: String(stats.longest), label: 'Longest Streak', x: 390 },
  ];

  const body = columns.map((col) => `
    <text x="${col.x}" y="70" text-anchor="middle" font-size="28" font-weight="700" fill="#${col.highlight ? colors.title : colors.text}">${escapeXml(col.value)}</text>
    <text x="${col.x}" y="95" text-anchor="middle" font-size="12" fill="#${colors.icon}">${escapeXml(col.label)}</text>
  `).join('');

  return renderCard({
    width,
    height,
    title: `${data.profile.name}'s Contribution Streak`,
    colors,
    hideBorder,
    body,
  });
};

export default (req, res) => handleGithubCardRequest(req, res, buildStreakCard);
