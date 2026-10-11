/**
 * motion — the one place GSAP is configured for the site.
 *
 * Everything animates transform + opacity only, so work stays on the
 * compositor. Durations are short and eases are a single family, so the whole
 * site moves with one voice instead of a mix of springs and curves.
 */
import { useEffect, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin,
  SplitText,
  ScrambleTextPlugin,
  DrawSVGPlugin,
  Flip,
  Draggable,
  InertiaPlugin,
  MorphSVGPlugin
);

// Shared voice: one ease family, three durations.
export const EASE = 'power3.out';
export const EASE_IN_OUT = 'power2.inOut';
export const DUR = { fast: 0.2, base: 0.45, slow: 0.7 };
// Headline reveals: a sharper curve so letters snap into place.
export const EASE_TEXT = 'expo.out';

gsap.defaults({ ease: EASE, duration: DUR.base });
// Skip ScrollTrigger refreshes caused only by the mobile URL bar.
ScrollTrigger.config({ ignoreMobileResize: true });

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false);

/**
 * ScrollTrigger `end` for "this section is in view": top 50% → bottom 50%,
 * plus the pin duration when the section is pinned (Experience), so the pinned
 * stretch still counts as that section. Read from the pin's own trigger — the
 * spacer is collapsed while refresh measures. Pair with refreshPriority: -1 so
 * the pin is measured first.
 */
export const sectionEnd = (section) => () => {
  const pin = ScrollTrigger.getAll().find((st) => st.pin === section);
  const pinned = pin ? pin.end - pin.start : 0;
  return `+=${section.offsetHeight + pinned}`;
};

export const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Live `prefers-reduced-motion` flag, a drop-in for framer-motion's hook. */
export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const media = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!media) return undefined;
    const onChange = (event) => setReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

/**
 * Keeps an element mounted while its exit animation plays — the
 * AnimatePresence replacement. Returns whether the element should render.
 *
 *   const shown = usePresence(open, ref, { enter: (el) => tween, exit: (el) => tween });
 *
 * `enter` / `exit` receive the element and return a tween or timeline.
 * Under reduced motion both are skipped: the element simply appears/disappears.
 */
export const usePresence = (open, ref, { enter, exit } = {}) => {
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Derive "closing" from the open → closed edge during render, so the
  // element never unmounts for a frame before its exit runs.
  if (prevOpen !== open) {
    setPrevOpen(open);
    setClosing(!open);
  }

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (prefersReducedMotion()) {
      if (!open) setClosing(false);
      return undefined;
    }

    if (open) {
      const anim = enter?.(el);
      return () => anim?.kill();
    }

    const anim = exit?.(el);
    if (!anim) {
      setClosing(false);
      return undefined;
    }
    anim.eventCallback('onComplete', () => setClosing(false));
    return () => anim.kill();
    // enter/exit are expected to be stable module-level functions.
  }, [open, closing]);

  return open || closing;
};

/**
 * ScrollTrigger only re-measures on window resize. Content that changes the
 * page height later (the hero portal mounting once its font loads, lazy
 * sections) leaves every trigger below it measured at the wrong position, so
 * re-measure whenever the document height actually changes (debounced).
 */
export const useScrollTriggerAutoRefresh = (enabled = true) => {
  useEffect(() => {
    if (!enabled || typeof ResizeObserver === 'undefined') return undefined;
    const doc = document.documentElement;
    let measured = doc.scrollHeight;
    let timer = 0;

    const onRefresh = () => { measured = doc.scrollHeight; };
    ScrollTrigger.addEventListener('refresh', onRefresh);

    const observer = new ResizeObserver(() => {
      if (Math.abs(doc.scrollHeight - measured) < 2) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }, 200);
    });
    observer.observe(document.body);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      ScrollTrigger.removeEventListener('refresh', onRefresh);
    };
  }, [enabled]);
};

export { gsap, ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin, MorphSVGPlugin };
