import React, { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input:not([type="hidden"]), textarea, select, label[for], .port-card, .port-link, .cf-submit, .floating-top-btn, .floating-faq-toggle, .floating-faq-notification, .ff-suggestion-btn, .build-card, .skill-card';

const MAGNETIC_SELECTOR =
  'a.btn-prime, button.btn-prime, a.btn-outline, button.btn-outline, .floating-top-btn';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    const hasFinePointer = window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    ).matches;
    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      document.documentElement.style.cursor = '';
      return undefined;
    }

    document.body.classList.add('has-custom-cursor');

    let mx = window.innerWidth * 0.5;
    let my = window.innerHeight * 0.5;
    let rx = mx;
    let ry = my;
    let rafId = 0;
    let currentMagnet = null;
    let magnetStrength = 0;
    // Magnet geometry is measured once per hover (and again after scroll/resize),
    // not on every pointermove. Stored untransformed: centre + reach.
    let magnetBox = null;
    let magnetOffsetX = 0;
    let magnetOffsetY = 0;

    // The scale lives in --cursor-scale-x/y (set by the body state classes in
    // index.css) and is composed here, because this inline transform replaces
    // the stylesheet's transform entirely.
    const setPos = (el, x, y) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(var(--cursor-scale-x, 1), var(--cursor-scale-y, 1))`;
    };

    const measureMagnet = () => {
      const rect = currentMagnet.getBoundingClientRect();
      // Remove the pull we applied ourselves so the box stays put.
      magnetBox = {
        x: rect.left + rect.width / 2 - magnetOffsetX,
        y: rect.top + rect.height / 2 - magnetOffsetY,
        threshold: Math.max(rect.width, rect.height) * 0.85,
      };
    };

    const invalidateMagnet = () => {
      magnetBox = null;
    };

    const releaseMagnet = () => {
      if (currentMagnet) currentMagnet.style.transform = '';
      currentMagnet = null;
      magnetBox = null;
      magnetOffsetX = 0;
      magnetOffsetY = 0;
      magnetStrength = 0;
    };

    // Runs only while something is moving; parks itself once the ring settles.
    const loop = () => {
      setPos(dot, mx, my);
      // Ring lerp: faster when magnetStrength is high
      const lerpFactor = 0.14 + magnetStrength * 0.06;
      rx += (mx - rx) * lerpFactor;
      ry += (my - ry) * lerpFactor;
      if (Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1) {
        rx = mx;
        ry = my;
        setPos(ring, rx, ry);
        rafId = 0;
        return;
      }
      setPos(ring, rx, ry);
      rafId = window.requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!rafId) rafId = window.requestAnimationFrame(loop);
    };

    const moveCursor = (e) => {
      mx = e.clientX;
      my = e.clientY;
      kick();

      // Magnetic effect for primary buttons
      if (currentMagnet) {
        if (!magnetBox) measureMagnet();
        const dx = e.clientX - magnetBox.x;
        const dy = e.clientY - magnetBox.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const { threshold } = magnetBox;

        if (dist < threshold) {
          const pull = 1 - dist / threshold;
          magnetStrength = pull;
          magnetOffsetX = dx * pull * 0.28;
          magnetOffsetY = dy * pull * 0.22;
          currentMagnet.style.transform = `translate(${magnetOffsetX}px, ${magnetOffsetY}px)`;
        } else {
          magnetStrength = 0;
          magnetOffsetX = 0;
          magnetOffsetY = 0;
          currentMagnet.style.transform = '';
        }
      }
    };

    const hoverOn = (e) => {
      const target = e.target.closest(INTERACTIVE_SELECTOR);
      if (target) {
        document.body.classList.add('cursor-hover');

        // Extra text-hover class for links
        if (target.tagName === 'A' && !target.classList.contains('btn-prime')) {
          document.body.classList.add('cursor-text');
        }

        // Magnetic
        const magnet = e.target.closest(MAGNETIC_SELECTOR);
        if (magnet && magnet !== currentMagnet) {
          releaseMagnet();
          currentMagnet = magnet;
          document.body.classList.add('cursor-magnet');
        }
      }
    };

    const hoverOff = (e) => {
      const fromInteractive = e.target.closest(INTERACTIVE_SELECTOR);
      if (!fromInteractive) return;
      const toInteractive = e.relatedTarget?.closest?.(INTERACTIVE_SELECTOR);

      if (!toInteractive) {
        document.body.classList.remove('cursor-hover');
        document.body.classList.remove('cursor-text');
      }

      const fromMagnet = e.target.closest(MAGNETIC_SELECTOR);
      if (fromMagnet) {
        const toMagnet = e.relatedTarget?.closest?.(MAGNETIC_SELECTOR);
        if (!toMagnet) {
          document.body.classList.remove('cursor-magnet');
          releaseMagnet();
        }
      }
    };

    const resetHover = () => {
      document.body.classList.remove('cursor-hover');
      document.body.classList.remove('cursor-text');
      document.body.classList.remove('cursor-magnet');
      releaseMagnet();
    };

    setPos(dot, mx, my);
    setPos(ring, rx, ry);

    window.addEventListener('pointermove', moveCursor, { passive: true });
    window.addEventListener('scroll', invalidateMagnet, { passive: true });
    window.addEventListener('resize', invalidateMagnet, { passive: true });
    document.addEventListener('pointerover', hoverOn, { passive: true });
    document.addEventListener('pointerout', hoverOff, { passive: true });
    window.addEventListener('blur', resetHover);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', moveCursor);
      window.removeEventListener('scroll', invalidateMagnet);
      window.removeEventListener('resize', invalidateMagnet);
      document.removeEventListener('pointerover', hoverOn);
      document.removeEventListener('pointerout', hoverOff);
      window.removeEventListener('blur', resetHover);
      document.body.classList.remove('has-custom-cursor');
      resetHover();
    };
  }, []);

  return (
    <>
      <div id="cursor" ref={dotRef}></div>
      <div id="cursor-ring" ref={ringRef}></div>
    </>
  );
};

export default CustomCursor;
