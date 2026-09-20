import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const SWIPE_PX = 48;
const SWIPE_VELOCITY = 0.11; // px per ms
const STICKY_TOP = 72;

const tileTransform = (offset, reduced) => {
  if (reduced) return { transform: 'none', opacity: offset === 0 ? 1 : 0, zIndex: offset === 0 ? 10 : 0 };
  const clamped = Math.max(-3, Math.min(3, offset));
  const abs = Math.abs(clamped);
  const dir = Math.sign(clamped);
  const x = dir * (abs === 0 ? 0 : 170 + (abs - 1) * 70);
  const z = -abs * 120;
  const rotate = -dir * Math.min(58, abs * 42);
  const opacity = abs >= 3 ? 0 : 1 - abs * 0.22;
  return {
    transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotate}deg)`,
    opacity,
    zIndex: 10 - abs,
    pointerEvents: abs >= 3 ? 'none' : 'auto',
  };
};

const ProjectCoverflow = ({ projects, onOpen }) => {
  const reduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef(null);
  const pinRef = useRef(null);
  const stageRef = useRef(null);
  const drag = useRef({ startX: 0, active: false, moved: false });

  const count = projects.length;
  const pinned = !reduced && count > 1;

  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    const wrap = pinRef.current && wrapRef.current;
    if (!wrap) return;
    const travel = wrapRef.current.offsetHeight - pinRef.current.offsetHeight;
    const top = wrapRef.current.getBoundingClientRect().top + window.scrollY - STICKY_TOP + (index / (count - 1)) * travel;
    window.scrollTo({ top, behavior });
  }, [count]);

  const goTo = useCallback((index, animate = true) => {
    const i = Math.max(0, Math.min(count - 1, index));
    if (pinned) scrollToIndex(i, animate ? 'smooth' : 'auto');
    else setActiveIndex(i);
  }, [count, pinned, scrollToIndex]);
  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);
  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);

  useEffect(() => {
    if (!pinned) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const wrap = wrapRef.current;
      const pin = pinRef.current;
      if (!wrap || !pin) return;
      const travel = wrap.offsetHeight - pin.offsetHeight;
      const progress = Math.max(0, Math.min(1, (STICKY_TOP - wrap.getBoundingClientRect().top) / travel));
      setActiveIndex(Math.round(progress * (count - 1)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pinned, count]);

  // The pinned coverflow fills the mobile viewport and .pcf-caption runs right
  // under the fixed floating controls. Flag the body while the pin is on screen
  // so CSS can stand them down — mobile only, see index.css.
  useEffect(() => {
    const pin = pinRef.current;
    if (!pin || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle('is-coverflow-onscreen', entry.isIntersecting);
      },
      { threshold: 0.5 },
    );
    observer.observe(pin);
    return () => {
      observer.disconnect();
      document.body.classList.remove('is-coverflow-onscreen');
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(activeIndex - 1, false); }
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(activeIndex + 1, false); }
    };
    stage.addEventListener('keydown', onKeyDown);
    return () => stage.removeEventListener('keydown', onKeyDown);
  }, [goTo, activeIndex]);

  const onPointerDown = (event) => {
    drag.current = { startX: event.clientX, startT: event.timeStamp, active: true, moved: false };
  };
  const onPointerMove = (event) => {
    if (!drag.current.active) return;
    if (Math.abs(event.clientX - drag.current.startX) > 6) drag.current.moved = true;
  };
  const endDrag = (event) => {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    const dt = Math.max(1, event.timeStamp - drag.current.startT);
    const velocity = Math.abs(dx) / dt;
    drag.current.active = false;
    if (Math.abs(dx) >= SWIPE_PX || (velocity > SWIPE_VELOCITY && Math.abs(dx) > 8)) {
      (dx < 0 ? next : prev)();
    }
  };
  const onClickCapture = (event) => {
    if (drag.current.moved) {
      event.stopPropagation();
      event.preventDefault();
      drag.current.moved = false;
    }
  };

  const active = projects[activeIndex];

  return (
    <div
      className={`pcf-scroll ${pinned ? 'is-pinned' : ''}`}
      ref={wrapRef}
      style={{ '--pcf-count': count }}
    >
    <div className="pcf-pin" ref={pinRef}>
    <div className="pcf-wrap">
      <div className="pcf-ambient" aria-hidden="true" />

      <div className="pcf-stage-wrap">
        <button type="button" className="pcf-nav pcf-nav-prev" onClick={prev} aria-label="Previous project">←</button>
        <button type="button" className="pcf-nav pcf-nav-next" onClick={next} aria-label="Next project">→</button>
      <div
        className="pcf-stage"
        ref={stageRef}
        tabIndex={0}
        role="group"
        aria-label="Project carousel — swipe, drag, or use arrow keys to browse"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {projects.map((p, i) => {
          const offset = i - activeIndex;
          const isActive = offset === 0;
          return (
            <button
              type="button"
              key={p.id}
              className={`notch-surface pcf-tile ${isActive ? 'is-active' : ''}`}
              style={tileTransform(offset, reduced)}
              onClick={() => (isActive ? onOpen(p) : goTo(i))}
              aria-current={isActive}
              aria-label={isActive ? `Open project details for ${p.title}` : `Show ${p.title}`}
              tabIndex={-1}
              draggable={false}
            >
              <span className="pcf-tab">
                <span className="pcf-tile-num">{p.num}</span>
                <span className="pcf-tab-arrow" aria-hidden="true">→</span>
              </span>
              <span className="pcf-corner pcf-corner-br" aria-hidden="true" />
              <span className="pcf-tile-ghost" aria-hidden="true">{p.num}</span>
              <span className="pcf-tile-top">
                {p.year && <span className="pcf-tile-year">{p.year}</span>}
              </span>
              <span className="pcf-tile-body">
                <span className="pcf-mask"><span className="pcf-tile-title">{p.title}</span></span>
                <span className="pcf-mask pcf-mask-late"><span className="pcf-tile-cat">{p.cat}</span></span>
                <span className="pcf-mask pcf-mask-late">
                  <span className="pcf-tile-stack">
                    {(p.stack || []).slice(0, 3).map((t) => <span key={t} className="pcf-tile-chip">{t}</span>)}
                  </span>
                </span>
                <span className="pcf-mask pcf-mask-later"><span className="pcf-tile-open">Open Case ↗</span></span>
              </span>
            </button>
          );
        })}
      </div>
      </div>

      <div className="pcf-controls">
        <div className="pcf-dots">
          {projects.map((p, i) => (
            <button
              type="button"
              key={p.id}
              className={`pcf-dot ${i === activeIndex ? 'is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to ${p.title}`}
            />
          ))}
        </div>
      </div>

      {active && (
        <p className="pcf-caption" key={active.id}>
          <span className="pcf-caption-cat">{active.cat}</span>
          <span className="pcf-caption-desc">{active.desc}</span>
        </p>
      )}
    </div>
    </div>
    </div>
  );
};

export default ProjectCoverflow;
