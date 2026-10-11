import { ensureMethod, createRateLimiter } from './_lib/requestGuards.js';
import { escapeXml, sanitizeHexColor } from './_lib/svgCard.js';
import { cardThemeColors, isCardTheme } from '../src/lib/cardThemes.js';

const DEFAULT_PAUSE_MS = 2000;
const ERASE_RATIO = 0.55;

// Only generic families: an SVG shown through <img> can't load web fonts, so
// these resolve to whatever the viewer's system has.
const FONTS = {
  mono: { stack: "Consolas, Menlo, 'Courier New', monospace", charWidth: 0.6 },
  sans: { stack: "'Segoe UI', Ubuntu, Arial, sans-serif", charWidth: 0.62 },
  serif: { stack: "Georgia, 'Times New Roman', serif", charWidth: 0.6 },
};
// ponytail: width is estimated as chars * size * charWidth. It's exact for mono
// and deliberately generous for proportional fonts (extra width only delays the
// reveal; too little would clip letters). Upgrade path: measure with a real shaper.
const BOLD_WIDTH_FACTOR = 1.07;
const SPEEDS = { slow: 130, normal: 70, fast: 35 };
const MAX_LINES = 8;
const MAX_LINE_LENGTH = 80;

const limitTypingRequests = createRateLimiter({
  keyPrefix: 'typing-svg',
  windowMs: 60_000,
  maxRequests: 60,
});

const parseLines = (raw) =>
  String(raw || '')
    .split(';')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_LINES)
    .map((line) => line.slice(0, MAX_LINE_LENGTH));

const dedupePoints = (points) => {
  const result = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (last && last[0] === point[0]) continue;
    result.push(point);
  }
  return result;
};

/**
 * Builds, for every line, the (time, revealedWidth) checkpoints for a
 * single SMIL <animate> spanning the WHOLE multi-line cycle: 0 everywhere
 * except during that line's own type -> hold -> erase window.
 */
export const buildTypingTimeline = (lines, { pauseMs = DEFAULT_PAUSE_MS, charWidth, typeMsPerChar = SPEEDS.normal } = {}) => {
  const safePauseMs = Math.max(1, pauseMs);
  const segments = lines.map((line) => ({
    line,
    typeDur: Math.max(1, line.length * typeMsPerChar),
    eraseDur: Math.max(1, line.length * typeMsPerChar * ERASE_RATIO),
    textWidth: line.length * charWidth,
  }));

  let elapsedMs = 0;
  const windows = segments.map((seg) => {
    const t0 = elapsedMs;
    const t1 = t0 + seg.typeDur;
    const t2 = t1 + safePauseMs;
    const t3 = t2 + seg.eraseDur;
    elapsedMs = t3;
    return { ...seg, t0, t1, t2, t3 };
  });

  const totalMs = elapsedMs;

  const perLine = windows.map((win) => {
    const points = dedupePoints([
      [0, 0],
      [win.t0, 0],
      [win.t1, win.textWidth],
      [win.t2, win.textWidth],
      [win.t3, 0],
      [totalMs, 0],
    ]);

    return {
      line: win.line,
      textWidth: win.textWidth,
      keyTimes: points.map(([time]) => time / totalMs),
      values: points.map(([, value]) => value),
    };
  });

  return { perLine, totalSec: totalMs / 1000 };
};

const buildTypingSvg = ({ lines, size, color, align, font, bold, speed, width: widthOverride, pauseMs }) => {
  const family = FONTS[font];
  const charWidth = size * family.charWidth * (bold ? BOLD_WIDTH_FACTOR : 1);
  const { perLine, totalSec } = buildTypingTimeline(lines, { pauseMs, charWidth, typeMsPerChar: SPEEDS[speed] });

  const height = Math.round(size * 1.8);
  const width = Math.max(widthOverride || 0, ...perLine.map((entry) => entry.textWidth)) + 20;
  const baselineY = Math.round(height / 2 + size * 0.35);

  const groups = perLine
    .map((entry, index) => {
      const x = align === 'center' ? (width - entry.textWidth) / 2 : align === 'right' ? width - entry.textWidth - 10 : 10;
      const valuesAttr = entry.values.map((v) => v.toFixed(2)).join(';');
      const keyTimesAttr = entry.keyTimes.map((t) => t.toFixed(6)).join(';');

      // The reveal starts at the text's own left edge, not at the SVG's.
      return `
        <clipPath id="typing-clip-${index}">
          <rect x="${x.toFixed(2)}" y="0" width="0" height="${height}">
            <animate attributeName="width" values="${valuesAttr}" keyTimes="${keyTimesAttr}" dur="${totalSec}s" repeatCount="indefinite" calcMode="linear" />
          </rect>
        </clipPath>
        <g clip-path="url(#typing-clip-${index})">
          <text x="${x.toFixed(2)}" y="${baselineY}" font-family="${family.stack}" font-size="${size}"${bold ? ' font-weight="700"' : ''} fill="#${color}">${escapeXml(entry.line)}</text>
        </g>
      `;
    })
    .join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${groups}
    </svg>
  `.trim();
};

export default function handler(req, res) {
  if (!ensureMethod(req, res, 'GET')) return;
  if (!limitTypingRequests(req, res)) return;

  const lines = parseLines(req.query?.lines);
  if (!lines.length) {
    res.status(400).json({ error: 'Query param "lines" (semicolon-separated) is required', code: 'INVALID_INPUT' });
    return;
  }

  const query = req.query || {};
  const size = Math.min(80, Math.max(10, Number(query.size) || 20));
  const themeAccent = isCardTheme(String(query.theme || '')) ? cardThemeColors(String(query.theme)).title : 'e4e6f1';
  const color = sanitizeHexColor(query.color, themeAccent);
  const align = ['left', 'center', 'right'].includes(query.align) ? query.align : query.center === 'true' ? 'center' : 'left';
  const font = Object.hasOwn(FONTS, query.font) ? query.font : 'mono';
  const speed = Object.hasOwn(SPEEDS, query.speed) ? query.speed : 'normal';
  const bold = query.weight === 'bold';
  const width = Math.min(1200, Math.max(0, Number(query.width) || 0));
  const pauseMs = Math.min(10_000, Math.max(0, Number(query.pause) || DEFAULT_PAUSE_MS));

  const svg = buildTypingSvg({ lines, size, color, align, font, bold, speed, width, pauseMs });

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate');
  res.status(200).send(svg);
}
