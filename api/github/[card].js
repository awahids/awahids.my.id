import { CARD_HANDLERS } from '../_lib/cards/index.js';
import { renderErrorCard, sendSvg } from '../_lib/svgCard.js';

// Vercel fills req.query.card from the [card] path segment, so the public
// URLs (/api/github/stats, /api/github/streak, ...) stay what they were.
export default function handler(req, res) {
  const card = String(req.query?.card || '');
  const cardHandler = Object.hasOwn(CARD_HANDLERS, card) ? CARD_HANDLERS[card] : null;
  if (!cardHandler) {
    sendSvg(res, renderErrorCard({ message: `Unknown card "${card}"` }), { status: 404, cacheSeconds: 0 });
    return undefined;
  }
  return cardHandler(req, res);
}
