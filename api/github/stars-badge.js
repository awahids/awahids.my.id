import { getCombinedRepoStars } from '../_lib/github.js';
import { renderErrorCard, renderFlatBadge, sendSvg } from '../_lib/svgCard.js';
import { ensureMethod, createRateLimiter } from '../_lib/requestGuards.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9-]{1,39}$/;
const REPO_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/;
const MAX_REPOS = 20;

const limitStarsBadgeRequests = createRateLimiter({
  keyPrefix: 'stars-badge',
  windowMs: 60_000,
  maxRequests: 30,
});

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'GET')) return;
  if (!limitStarsBadgeRequests(req, res)) return;

  const username = String(req.query?.username || '').trim();
  const repos = String(req.query?.repos || '')
    .split(',')
    .map((repo) => repo.trim())
    .filter(Boolean)
    .slice(0, MAX_REPOS);

  if (!USERNAME_PATTERN.test(username) || !repos.length || !repos.every((repo) => REPO_PATTERN.test(repo))) {
    sendSvg(res, renderErrorCard({ message: 'Invalid or missing "username"/"repos" query params', width: 220, height: 40 }), {
      status: 400,
      cacheSeconds: 0,
    });
    return;
  }

  try {
    const totalStars = await getCombinedRepoStars(username, repos);
    const svg = renderFlatBadge({
      label: '★ stars',
      value: totalStars.toLocaleString('en-US'),
      labelColor: '#555',
      valueColor: '#dfb317',
    });

    sendSvg(res, svg, { cacheSeconds: 3600 });
  } catch (error) {
    const status = Number.isFinite(error?.status) ? error.status : 500;
    sendSvg(res, renderErrorCard({ message: error?.message || 'Unexpected error', width: 220, height: 40 }), {
      status,
      cacheSeconds: 0,
    });
  }
}
