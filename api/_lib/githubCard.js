import { getGithubProfileData } from './github.js';
import { parseColorsFromQuery, isHideBorder, renderErrorCard, sendSvg } from './svgCard.js';
import { ensureMethod, createRateLimiter } from './requestGuards.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9-]{1,39}$/;

const limitGithubCardRequests = createRateLimiter({
  keyPrefix: 'github-card',
  windowMs: 60_000,
  maxRequests: 30,
});

/**
 * Shared GET handler for the stats/top-langs/streak/activity-graph cards:
 * validates the username, rate-limits, fetches profile data once, and
 * turns any GithubServiceError into a renderable SVG instead of JSON
 * (these endpoints are embedded as <img>, so a JSON error body is useless).
 */
export const handleGithubCardRequest = async (req, res, buildCard) => {
  if (!ensureMethod(req, res, 'GET')) return;
  if (!limitGithubCardRequests(req, res)) return;

  const username = String(req.query?.username || '').trim();
  if (!USERNAME_PATTERN.test(username)) {
    sendSvg(res, renderErrorCard({ message: 'Invalid or missing "username" query param' }), {
      status: 400,
      cacheSeconds: 0,
    });
    return;
  }

  const colors = parseColorsFromQuery(req.query);
  const hideBorder = isHideBorder(req.query);

  try {
    const data = await getGithubProfileData(username);
    const svg = buildCard(data, { colors, hideBorder, query: req.query });
    sendSvg(res, svg);
  } catch (error) {
    const status = Number.isFinite(error?.status) ? error.status : 500;
    sendSvg(res, renderErrorCard({ message: error?.message || 'Unexpected error' }), {
      status,
      cacheSeconds: status === 404 ? 300 : 0,
    });
  }
};
