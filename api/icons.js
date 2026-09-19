import { resolveIcon } from './_lib/simpleIcons.js';
import { escapeXml } from './_lib/svgCard.js';
import { ensureMethod, createRateLimiter } from './_lib/requestGuards.js';

const MAX_ICONS = 60;
const BADGE = 48;
const GAP = 8;

const limitIconRequests = createRateLimiter({
  keyPrefix: 'icons',
  windowMs: 60_000,
  maxRequests: 60,
});

const renderBadge = (icon, x, y) => {
  if (!icon.path) {
    return `
      <g transform="translate(${x},${y})">
        <rect width="${BADGE}" height="${BADGE}" rx="10" fill="#262a3d" />
        <text x="${BADGE / 2}" y="${BADGE / 2 + 3}" text-anchor="middle" font-size="8" fill="#8b90ab" font-family="'Segoe UI', sans-serif">${escapeXml(icon.title.slice(0, 4))}</text>
      </g>`;
  }

  const scale = (BADGE * 0.6) / 24;
  const offset = (BADGE - 24 * scale) / 2;
  const color = icon.hex ? `#${icon.hex}` : '#e4e6f1';

  return `
    <g transform="translate(${x},${y})">
      <rect width="${BADGE}" height="${BADGE}" rx="10" fill="#262a3d" />
      <g transform="translate(${offset.toFixed(2)},${offset.toFixed(2)}) scale(${scale.toFixed(4)})">
        <path d="${icon.path}" fill="${color}" />
      </g>
    </g>`;
};

// Single flex-like row — no row-wrapping math, icons just line up left to right.
export const buildIconsGrid = (codes) => {
  const icons = codes.map(resolveIcon).filter(Boolean);
  const width = icons.length * (BADGE + GAP) - GAP;
  const height = BADGE;

  const badges = icons.map((icon, index) => renderBadge(icon, index * (BADGE + GAP), 0)).join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${badges}</svg>`;
};

export default function handler(req, res) {
  if (!ensureMethod(req, res, 'GET')) return;
  if (!limitIconRequests(req, res)) return;

  const codes = String(req.query?.i || '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean)
    .slice(0, MAX_ICONS);

  if (!codes.length) {
    res.status(400).json({ error: 'Query param "i" (comma-separated icon codes) is required', code: 'INVALID_INPUT' });
    return;
  }

  const svg = buildIconsGrid(codes);

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate');
  res.status(200).send(svg);
}
