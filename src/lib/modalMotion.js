/**
 * Shared modal enter/exit, for use with usePresence():
 *
 *   const shown = usePresence(open, overlayRef, { enter: modalEnter, exit: modalExit });
 *
 * Markup contract: the overlay is the ref'd element, the card carries
 * [data-modal-card], and sections that should cascade in carry [data-modal-child].
 * Only opacity and transform animate — the backdrop blur is static CSS.
 */
import { gsap, DUR } from './motion';

const parts = (overlay) => {
  const card = overlay.querySelector('[data-modal-card]');
  const children = card ? card.querySelectorAll('[data-modal-child]') : [];
  return { card, children };
};

export const modalEnter = (overlay) => {
  const { card, children } = parts(overlay);
  const tl = gsap.timeline();
  tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: DUR.fast });
  if (card) {
    tl.fromTo(
      card,
      { opacity: 0, y: 28, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: DUR.base, clearProps: 'transform' },
      0
    );
  }
  if (children.length) {
    tl.fromTo(
      children,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.32, stagger: 0.05, clearProps: 'transform' },
      0.08
    );
  }
  return tl;
};

export const modalExit = (overlay) => {
  const { card } = parts(overlay);
  const tl = gsap.timeline();
  if (card) tl.to(card, { opacity: 0, y: 14, scale: 0.98, duration: 0.16 }, 0);
  tl.to(overlay, { opacity: 0, duration: 0.18 }, 0);
  return tl;
};

/*
 * Shared-element variants: the card grows out of a source rect (a tile) and
 * shrinks back into it. The overlay itself stays opaque; only its
 * [data-modal-backdrop] fades, so the card is visible from the first frame.
 */
const MORPH = { duration: 0.6, ease: 'expo.inOut' };

// The card's layout box, ignoring any transform left by an interrupted tween.
const layoutRect = (card) => {
  const prev = card.style.transform;
  card.style.transform = 'none';
  const rect = card.getBoundingClientRect();
  card.style.transform = prev;
  return rect;
};

const fitTo = (from, to) => ({
  x: from.left - to.left,
  y: from.top - to.top,
  scaleX: from.width / to.width,
  scaleY: from.height / to.height,
});

const isOnScreen = (el) => {
  if (!el?.isConnected) return null;
  const rect = el.getBoundingClientRect();
  const visible =
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth &&
    Number(getComputedStyle(el).opacity) > 0.5;
  return visible ? rect : null;
};

export const modalEnterFromRect = (overlay, from) => {
  const { card, children } = parts(overlay);
  if (!card || !from?.width || !from?.height) return modalEnter(overlay);
  const backdrop = overlay.querySelector('[data-modal-backdrop]');
  const content = [card.querySelector('.modal-close'), ...children].filter(Boolean);
  const to = layoutRect(card);

  gsap.set(overlay, { opacity: 1 });
  const tl = gsap.timeline();
  if (backdrop) tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: DUR.base }, 0);
  tl.fromTo(
    card,
    { ...fitTo(from, to), opacity: 1, transformOrigin: '0 0' },
    { x: 0, y: 0, scaleX: 1, scaleY: 1, ...MORPH, clearProps: 'transform,transformOrigin' },
    0
  );
  if (content.length) {
    tl.fromTo(
      content,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.32, stagger: 0.05, clearProps: 'transform,opacity' },
      MORPH.duration - 0.08
    );
  }
  return tl;
};

// Returns null when the tile is gone or off screen, so callers can fall back to modalExit.
export const modalExitToElement = (overlay, target) => {
  const { card, children } = parts(overlay);
  const from = isOnScreen(target);
  if (!card || !from) return null;
  const backdrop = overlay.querySelector('[data-modal-backdrop]');
  const content = [card.querySelector('.modal-close'), ...children].filter(Boolean);
  const to = layoutRect(card);

  const tl = gsap.timeline();
  if (content.length) tl.to(content, { opacity: 0, duration: 0.14, stagger: 0 }, 0);
  tl.set(card, { transformOrigin: '0 0' }, 0);
  tl.to(card, { ...fitTo(from, to), ...MORPH, duration: 0.55 }, 0.06);
  if (backdrop) tl.to(backdrop, { opacity: 0, duration: 0.4 }, 0.18);
  tl.to(card, { opacity: 0, duration: 0.14 }, '-=0.14');
  return tl;
};
