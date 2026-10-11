import { incrementPageView } from './_lib/pageViews.js';
import { renderErrorCard, renderFlatBadge, sendSvg } from './_lib/svgCard.js';
import { ensureMethod, createRateLimiter } from './_lib/requestGuards.js';

const KEY_PATTERN = /^[a-zA-Z0-9._-]{1,80}$/;

const limitVisitorCountRequests = createRateLimiter({
  keyPrefix: 'visitor-count',
  windowMs: 60_000,
  maxRequests: 60,
});

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'GET')) return;
  if (!limitVisitorCountRequests(req, res)) return;

  const key = String(req.query?.username || '').trim();
  if (!KEY_PATTERN.test(key)) {
    sendSvg(res, renderErrorCard({ message: 'Invalid or missing "username" query param', width: 200, height: 40 }), {
      status: 400,
      cacheSeconds: 0,
    });
    return;
  }

  try {
    const count = await incrementPageView(key);
    const svg = renderFlatBadge({
      label: '\u{1F441} visitors',
      value: count.toLocaleString('en-US'),
      labelColor: '#555',
      valueColor: '#007ec6',
    });

    // Never cache — every fetch of this image is a visit and must increment.
    sendSvg(res, svg, { cacheSeconds: 0 });
  } catch (error) {
    const status = Number.isFinite(error?.status) ? error.status : 500;
    sendSvg(res, renderErrorCard({ message: error?.message || 'Unexpected error', width: 200, height: 40 }), {
      status,
      cacheSeconds: 0,
    });
  }
}
