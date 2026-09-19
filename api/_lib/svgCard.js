import { cardThemeColors } from '../../src/lib/cardThemes.js';

const HEX_COLOR_PATTERN = /^[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/;

/** Escapes text before it is interpolated into SVG markup. */
export const escapeXml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[char]);

/** Only accepts a bare 3/6-digit hex so query params can't inject SVG attributes. */
export const sanitizeHexColor = (value, fallback) =>
  value && HEX_COLOR_PATTERN.test(value) ? value : fallback;

// `theme` picks a base palette; explicit *_color params still override single colors.
export const parseColorsFromQuery = (query = {}) => {
  const base = cardThemeColors(String(query.theme || ''));
  return {
    bg: sanitizeHexColor(query.bg_color, base.bg),
    border: sanitizeHexColor(query.border_color, base.border),
    title: sanitizeHexColor(query.title_color, base.title),
    text: sanitizeHexColor(query.text_color, base.text),
    icon: sanitizeHexColor(query.icon_color, base.icon),
  };
};

export const isHideBorder = (query = {}) => query.hide_border === 'true';

export const renderCard = ({ width, height, title, colors, hideBorder, body }) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Ubuntu, Sans-Serif">
  <rect x="0.5" y="0.5" rx="8" width="${width - 1}" height="${height - 1}" fill="#${colors.bg}"
    ${hideBorder ? '' : `stroke="#${colors.border}" stroke-width="1"`} />
  ${title ? `<text x="25" y="35" font-size="20" font-weight="600" fill="#${colors.title}">${escapeXml(title)}</text>` : ''}
  ${body}
</svg>`.trim();

export const renderErrorCard = ({ message, width = 480, height = 120 }) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Ubuntu, Sans-Serif">
  <rect x="0.5" y="0.5" rx="8" width="${width - 1}" height="${height - 1}" fill="#fff0f0" stroke="#e05252" stroke-width="1" />
  <text x="${width / 2}" y="${height / 2 - 8}" text-anchor="middle" font-size="16" font-weight="600" fill="#e05252">Something went wrong</text>
  <text x="${width / 2}" y="${height / 2 + 14}" text-anchor="middle" font-size="12" fill="#e05252">${escapeXml(message)}</text>
</svg>`.trim();

const BADGE_CHAR_WIDTH = 7;
const BADGE_PADDING = 10;
const BADGE_HEIGHT = 20;

/**
 * Classic two-tone "flat" badge (label + colored value segment, rounded
 * corners) — the shape every shields.io/komarev-style generator uses,
 * instead of a plain boxed card.
 */
export const renderFlatBadge = ({ label, value, labelColor = '#555', valueColor = '#4c1' }) => {
  const labelWidth = label.length * BADGE_CHAR_WIDTH + BADGE_PADDING * 2;
  const valueWidth = value.length * BADGE_CHAR_WIDTH + BADGE_PADDING * 2;
  const width = labelWidth + valueWidth;

  return `<svg width="${width}" height="${BADGE_HEIGHT}" viewBox="0 0 ${width} ${BADGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <clipPath id="rb-clip"><rect width="${width}" height="${BADGE_HEIGHT}" rx="3" fill="#fff" /></clipPath>
  <g clip-path="url(#rb-clip)">
    <rect width="${labelWidth}" height="${BADGE_HEIGHT}" fill="${labelColor}" />
    <rect x="${labelWidth}" width="${valueWidth}" height="${BADGE_HEIGHT}" fill="${valueColor}" />
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana, Geneva, DejaVu Sans, sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${escapeXml(label)}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${escapeXml(value)}</text>
  </g>
</svg>`;
};

export const sendSvg = (res, svg, { status = 200, cacheSeconds = 3600 } = {}) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate`);
  res.status(status).send(svg);
};
