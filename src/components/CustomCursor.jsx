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
    if (!hasFinePointer) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      return undefined;
    }

    let mx = window.innerWidth * 0.5;
    let my = window.innerHeight * 0.5;
    let rx = mx;
    let ry = my;
    let rafId = 0;
    let currentMagnet = null;
    let magnetStrength = 0;

    const setPos = (el, x, y) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const moveCursor = (e) => {
      mx = e.clientX;
      my = e.clientY;

      // Magnetic effect for primary buttons
      if (currentMagnet) {
        const rect = currentMagnet.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const threshold = Math.max(rect.width, rect.height) * 0.85;

        if (dist < threshold) {
          const pull = 1 - dist / threshold;
          magnetStrength = pull;
          const offsetX = dx * pull * 0.28;
          const offsetY = dy * pull * 0.22;
          currentMagnet.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        } else {
          magnetStrength = 0;
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
        if (magnet) {
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
          if (currentMagnet) {
            currentMagnet.style.transform = '';
            currentMagnet = null;
          }
          magnetStrength = 0;
        }
      }
    };

    const resetHover = () => {
      document.body.classList.remove('cursor-hover');
      document.body.classList.remove('cursor-text');
      document.body.classList.remove('cursor-magnet');
      if (currentMagnet) {
        currentMagnet.style.transform = '';
        currentMagnet = null;
      }
      magnetStrength = 0;
    };

    const loop = () => {
      setPos(dot, mx, my);
      // Ring lerp: faster when magnetStrength is high
      const lerpFactor = 0.14 + magnetStrength * 0.06;
      rx += (mx - rx) * lerpFactor;
      ry += (my - ry) * lerpFactor;
      setPos(ring, rx, ry);
      rafId = window.requestAnimationFrame(loop);
    };

    loop();

    window.addEventListener('pointermove', moveCursor, { passive: true });
    document.addEventListener('pointerover', hoverOn, { passive: true });
    document.addEventListener('pointerout', hoverOff, { passive: true });
    window.addEventListener('blur', resetHover);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', moveCursor);
      document.removeEventListener('pointerover', hoverOn);
      document.removeEventListener('pointerout', hoverOff);
      window.removeEventListener('blur', resetHover);
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
