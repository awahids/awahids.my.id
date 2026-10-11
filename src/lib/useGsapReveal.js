/**
 * useGsapReveal — scroll-in reveals for everything inside `containerRef`.
 *
 * Mark elements with data-gsap-reveal="<type>":
 *   up | fade-up  rise + fade        left  slide from the left + fade
 *   pop           rise + slight scale  fade  opacity only
 *   line          scaleX from 0 (rules / dividers)
 *   stagger-children  reveal the element's direct children in sequence
 *   split         SplitText: characters rise out of a per-line mask (headlines)
 *   split-lines   SplitText: whole lines rise (long or badge-styled headlines)
 *   draw          DrawSVG: an <svg>'s strokes draw themselves in
 *
 * The simple types share ONE ScrollTrigger.batch per container, so elements
 * entering together are staggered by a single tween instead of each owning a
 * trigger + timeline. Transforms are cleared once revealed so finished
 * elements stop holding compositor layers.
 */
import { gsap, ScrollTrigger, DUR, prefersReducedMotion, useIsoLayoutEffect } from './motion';
import { splitReveal } from './splitReveal';

const HIDDEN = {
  up: { opacity: 0, y: 24 },
  'fade-up': { opacity: 0, y: 24 },
  left: { opacity: 0, x: -20 },
  pop: { opacity: 0, y: 28, scale: 0.97 },
  fade: { opacity: 0 },
  line: { scaleX: 0, transformOrigin: '0% 50%' },
};

const SHOWN = { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1 };

export const SVG_SHAPES = 'path, line, polyline, polygon, circle, rect, ellipse';

/** Draw an icon's strokes in, one shape after another. */
export const drawIn = (shapes, vars = {}) =>
  gsap.fromTo(
    shapes,
    { drawSVG: '0%' },
    { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.12, ...vars }
  );

const onceInView = (trigger, onReveal) =>
  ScrollTrigger.create({
    trigger,
    start: 'top 90%',
    // Fire for elements already scrolled past on load (deep links, reloads).
    onEnter: (self) => { onReveal(); self.kill(); },
    onLeave: (self) => { onReveal(); self.kill(); },
  });

export const useGsapReveal = (containerRef) => {
  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      const simple = [];

      container.querySelectorAll('[data-gsap-reveal]').forEach((el) => {
        const type = el.dataset.gsapReveal || 'up';

        if (HIDDEN[type]) {
          gsap.set(el, HIDDEN[type]);
          simple.push(el);
          return;
        }

        if (type === 'stagger-children') {
          const children = Array.from(el.children);
          if (!children.length) return;
          gsap.set(children, HIDDEN.up);
          onceInView(el, () =>
            gsap.to(children, { ...SHOWN, duration: DUR.base, stagger: 0.06, clearProps: 'transform' })
          );
          return;
        }

        if (type === 'split' || type === 'split-lines') {
          splitReveal(el, { byLine: type === 'split-lines' });
          return;
        }

        if (type === 'draw') {
          const shapes = el.querySelectorAll(SVG_SHAPES);
          if (!shapes.length) return;
          gsap.set(shapes, { drawSVG: '0%' });
          onceInView(el, () => drawIn(shapes, { delay: 0.15 }));
        }
      });

      if (!simple.length) return;

      const revealed = new WeakSet();
      const reveal = (batch) => {
        const fresh = batch.filter((el) => !revealed.has(el));
        if (!fresh.length) return;
        fresh.forEach((el) => revealed.add(el));
        gsap.to(fresh, {
          ...SHOWN,
          duration: DUR.slow,
          stagger: 0.07,
          overwrite: true,
          clearProps: 'transform,transformOrigin',
        });
      };

      ScrollTrigger.batch(simple, {
        start: 'top 90%',
        interval: 0.08,
        batchMax: 8,
        onEnter: reveal,
        onLeave: reveal,
        onEnterBack: reveal,
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef]);
};
