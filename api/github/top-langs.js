import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

const FALLBACK_COLOR = '858585';

// Every language found across the profile's repos, already sorted most-used
// first by getGithubProfileData — no artificial top-N cap.
const buildTopLangsCard = (data, { colors, hideBorder }) => {
  const languages = data.languages;
  const totalSize = languages.reduce((sum, lang) => sum + lang.size, 0) || 1;

  const width = 400;
  const height = 55 + languages.length * 30;

  const rows = languages.map((lang, index) => {
    const y = 60 + index * 30;
    const percent = ((lang.size / totalSize) * 100).toFixed(1);
    const barWidth = Math.max(2, (lang.size / totalSize) * 260);
    const dotColor = lang.color || `#${FALLBACK_COLOR}`;

    return `
      <circle cx="30" cy="${y - 5}" r="5" fill="${dotColor}" />
      <text x="42" y="${y}" font-size="13" fill="#${colors.text}">${escapeXml(lang.name)} ${percent}%</text>
      <rect x="30" y="${y + 6}" width="260" height="6" rx="3" fill="#${colors.border}" />
      <rect x="30" y="${y + 6}" width="${barWidth}" height="6" rx="3" fill="${dotColor}" />
    `;
  }).join('');

  return renderCard({
    width,
    height,
    title: 'Most Used Languages',
    colors,
    hideBorder,
    body: rows,
  });
};

export default (req, res) => handleGithubCardRequest(req, res, buildTopLangsCard);
