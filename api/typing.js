import { ensureMethod, createRateLimiter } from './_lib/requestGuards.js';
import { escapeXml, sanitizeHexColor } from './_lib/svgCard.js';

const TYPE_MS_PER_CHAR = 70;
const ERASE_MS_PER_CHAR = 40;
const DEFAULT_PAUSE_MS = 2000;
// ponytail: assumes a monospace-ish font so char-count * this factor is a
// decent stand-in for pixel width. Upgrade path: measure with a real text
// shaper if a non-monospace font is ever requested.
const CHAR_WIDTH_FACTOR = 0.6;
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
export const buildTypingTimeline = (lines, { pauseMs = DEFAULT_PAUSE_MS, charWidth } = {}) => {
  const safePauseMs = Math.max(1, pauseMs);
  const segments = lines.map((line) => ({
    line,
    typeDur: Math.max(1, line.length * TYPE_MS_PER_CHAR),
    eraseDur: Math.max(1, line.length * ERASE_MS_PER_CHAR),
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

const buildTypingSvg = ({ lines, size, color, center, width: widthOverride, pauseMs }) => {
  const charWidth = size * CHAR_WIDTH_FACTOR;
  const { perLine, totalSec } = buildTypingTimeline(lines, { pauseMs, charWidth });

  const height = Math.round(size * 1.8);
  const width = Math.max(widthOverride || 0, ...perLine.map((entry) => entry.textWidth)) + 20;
  const baselineY = Math.round(height / 2 + size * 0.35);

  const groups = perLine
    .map((entry, index) => {
      const x = center ? (width - entry.textWidth) / 2 : 10;
      const valuesAttr = entry.values.map((v) => v.toFixed(2)).join(';');
      const keyTimesAttr = entry.keyTimes.map((t) => t.toFixed(6)).join(';');

      return `
        <clipPath id="typing-clip-${index}">
          <rect x="0" y="0" width="0" height="${height}">
            <animate attributeName="width" values="${valuesAttr}" keyTimes="${keyTimesAttr}" dur="${totalSec}s" repeatCount="indefinite" calcMode="linear" />
          </rect>
        </clipPath>
        <g clip-path="url(#typing-clip-${index})">
          <text x="${x}" y="${baselineY}" font-family="Consolas, Menlo, 'Courier New', monospace" font-size="${size}" fill="#${color}">${escapeXml(entry.line)}</text>
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

  const size = Math.min(80, Math.max(10, Number(req.query?.size) || 20));
  const color = sanitizeHexColor(req.query?.color, 'e4e6f1');
  const center = req.query?.center === 'true';
  const width = Math.min(1200, Math.max(0, Number(req.query?.width) || 0));
  const pauseMs = Math.min(10_000, Math.max(0, Number(req.query?.pause) || DEFAULT_PAUSE_MS));

  const svg = buildTypingSvg({ lines, size, color, center, width, pauseMs });

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate');
  res.status(200).send(svg);
}
