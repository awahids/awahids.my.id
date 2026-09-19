import { handleGithubCardRequest } from '../_lib/githubCard.js';
import { renderCard, escapeXml } from '../_lib/svgCard.js';

const FALLBACK_COLOR = '858585';
const MAX_LANGUAGES = 5;
const MAX_NAME_LENGTH = 16;
const BAR_WIDTH = 245;

// Fixed 300x195 so it sits next to the stats card at the same height instead
// of growing with the number of languages (and being shrunk to unreadable
// text when a README constrains its height).
const buildTopLangsCard = (data, { colors, hideBorder }) => {
  const totalSize = data.languages.reduce((sum, lang) => sum + lang.size, 0) || 1;
  const languages = data.languages.slice(0, MAX_LANGUAGES);

  const rows = languages.map((lang, index) => {
    const y = 70 + index * 25;
    const share = lang.size / totalSize;
    const dotColor = lang.color || `#${FALLBACK_COLOR}`;
    const name = lang.name.length > MAX_NAME_LENGTH ? `${lang.name.slice(0, MAX_NAME_LENGTH - 1)}…` : lang.name;

    return `
      <circle cx="31" cy="${y - 5}" r="5" fill="${dotColor}" />
      <text x="44" y="${y}" font-size="14" fill="#${colors.text}">${escapeXml(name)}</text>
      <text x="275" y="${y}" text-anchor="end" font-size="14" font-weight="700" fill="#${colors.icon}">${(share * 100).toFixed(1)}%</text>
      <rect x="30" y="${y + 6}" width="${BAR_WIDTH}" height="6" rx="3" fill="#${colors.border}" />
      <rect x="30" y="${y + 6}" width="${Math.max(4, share * BAR_WIDTH)}" height="6" rx="3" fill="${dotColor}" />
    `;
  }).join('');

  return renderCard({
    width: 300,
    height: 195,
    title: 'Most Used Languages',
    colors,
    hideBorder,
    body: rows,
  });
};

export default (req, res) => handleGithubCardRequest(req, res, buildTopLangsCard);
