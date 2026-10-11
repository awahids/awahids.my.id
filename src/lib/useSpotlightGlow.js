import { useEffect } from 'react';

const LIGHT_SECTION_SELECTOR = '.s-build, .s-exp, .s-cert';

export const useSpotlightGlow = (elementRef) => {
  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined') return undefined;

    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const desktopQuery = window.matchMedia('(min-width: 769px)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let rafId = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let isTracking = false;

    const applyPosition = () => {
      el.style.setProperty('--spot-x', `${targetX}px`);
      el.style.setProperty('--spot-y', `${targetY}px`);
      rafId = 0;
    };

    const handlePointerMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!rafId) rafId = window.requestAnimationFrame(applyPosition);
    };

    const shouldTrack = () =>
      finePointerQuery.matches && desktopQuery.matches && !reducedMotionQuery.matches;

    const addMediaListener = (query, handler) => {
      if (query.addEventListener) {
        query.addEventListener('change', handler);
        return () => query.removeEventListener('change', handler);
      }
      query.addListener(handler);
      return () => query.removeListener(handler);
    };

    const syncTracking = () => {
      const nextTracking = shouldTrack();
      if (nextTracking === isTracking) return;

      isTracking = nextTracking;
      if (isTracking) {
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        applyPosition();
        return;
      }

      window.removeEventListener('pointermove', handlePointerMove);
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const removeMediaListeners = [
      addMediaListener(finePointerQuery, syncTracking),
      addMediaListener(desktopQuery, syncTracking),
      addMediaListener(reducedMotionQuery, syncTracking),
    ];

    syncTracking();

    const lightSections = Array.from(document.querySelectorAll(LIGHT_SECTION_SELECTOR));
    let observer;
    if (lightSections.length) {
      observer = new IntersectionObserver(
        (entries) => {
          const anyLightInView = entries.some((entry) => entry.isIntersecting);
          document.body.classList.toggle('is-on-light-section', anyLightInView);
        },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      lightSections.forEach((section) => observer.observe(section));
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.cancelAnimationFrame(rafId);
      removeMediaListeners.forEach((remove) => remove());
      observer?.disconnect();
      document.body.classList.remove('is-on-light-section');
    };
  }, [elementRef]);
};
