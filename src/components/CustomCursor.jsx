import React, { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input:not([type="hidden"]), textarea, select, label[for], .port-card, .port-link, .cf-submit, .floating-top-btn';

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

    const setPos = (el, x, y) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const moveCursor = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const hoverOn = (e) => {
      if (e.target.closest(INTERACTIVE_SELECTOR)) {
        document.body.classList.add('cursor-hover');
      }
    };

    const hoverOff = (e) => {
      const fromInteractive = e.target.closest(INTERACTIVE_SELECTOR);
      if (!fromInteractive) return;
      const toInteractive = e.relatedTarget?.closest?.(INTERACTIVE_SELECTOR);
      if (!toInteractive) document.body.classList.remove('cursor-hover');
    };

    const resetHover = () => {
      document.body.classList.remove('cursor-hover');
    };

    const loop = () => {
      setPos(dot, mx, my);
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
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
