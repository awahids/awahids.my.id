import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const SWIPE_PX = 48;
const SWIPE_VELOCITY = 0.11; // px per ms
const STICKY_TOP = 72;

const DRAG_PX_PER_SLIDE = 170; // the active tile's own travel for one slide
const DRAG_THRESHOLD_PX = 10; // §10 hysteresis before the carousel commits
const DECELERATION = 0.998; // §6, Apple's normal scroll feel
const SPRING_DAMPING = 0.8; // §4, momentum-driven so a little bounce is right
const SPRING_RESPONSE = 0.35; // §4, seconds
const RUBBER_CONSTANT = 0.55; // §9

const rubberband = (overshoot, dimension = 1, constant = RUBBER_CONSTANT) =>
  (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));

const tileTransform = (offset, reduced) => {
  if (reduced) return { transform: 'none', opacity: offset === 0 ? 1 : 0, zIndex: offset === 0 ? 10 : 0 };
  const clamped = Math.max(-3, Math.min(3, offset));
  const abs = Math.abs(clamped);
  const dir = Math.sign(clamped);
  const x = dir * (abs <= 1 ? 170 * abs : 170 + (abs - 1) * 70);
  const z = -abs * 120;
  const rotate = -dir * Math.min(58, abs * 42);
  const fade = abs >= 3 ? 0 : Math.min(1, (3 - abs) / 0.5);
  const opacity = Math.max(0, 1 - abs * 0.22) * fade;
  return {
    transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotate}deg)`,
    opacity,
    zIndex: Math.round(10 - abs),
    pointerEvents: abs >= 3 ? 'none' : 'auto',
  };
};

const ProjectCoverflow = ({ projects, onOpen, lenisRef }) => {
  const reduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef(null);
  const pinRef = useRef(null);
  const stageRef = useRef(null);
  const drag = useRef({ startX: 0, active: false, moved: false });
  const positionRef = useRef(0);
  const activeIndexRef = useRef(0);
  const tileRefs = useRef([]);
  const modeRef = useRef('scroll'); // 'scroll' | 'drag' | 'spring'
  const springRaf = useRef(0);

  const count = projects.length;
  const pinned = !reduced && count > 1;

  // While pinned the rAF handler owns transform/opacity/zIndex/pointerEvents so
  // the position can be a float; React must not also write them.
  const applyTiles = useCallback((pos) => {
    tileRefs.current.forEach((el, i) => {
      if (!el) return;
      const s = tileTransform(i - pos, false);
      el.style.transform = s.transform;
      el.style.opacity = String(s.opacity);
      el.style.zIndex = String(s.zIndex);
      el.style.pointerEvents = s.pointerEvents;
    });
  }, []);

  const scrollYForIndex = useCallback((index) => {
    const wrap = pinRef.current && wrapRef.current;
    if (!wrap) return null;
    const travel = wrapRef.current.offsetHeight - pinRef.current.offsetHeight;
    return wrapRef.current.getBoundingClientRect().top + window.scrollY - STICKY_TOP + (index / (count - 1)) * travel;
  }, [count]);

  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    const top = scrollYForIndex(index);
    if (top == null) return;
    window.scrollTo({ top, behavior });
  }, [scrollYForIndex]);

  // The single writer for the presentation position: tiles every frame, React
  // only when the rounded index actually changes.
  const setPosition = useCallback((pos) => {
    positionRef.current = pos;
    applyTiles(pos);
    const rounded = Math.max(0, Math.min(count - 1, Math.round(pos)));
    if (rounded !== activeIndexRef.current) {
      activeIndexRef.current = rounded;
      setActiveIndex(rounded);
    }
  }, [count, applyTiles]);

  const withRubberband = useCallback((raw) => {
    const max = count - 1;
    if (raw < 0) return -rubberband(-raw);
    if (raw > max) return max + rubberband(raw - max);
    return raw;
  }, [count]);

  const cancelSpring = useCallback(() => {
    if (springRaf.current) cancelAnimationFrame(springRaf.current);
    springRaf.current = 0;
  }, []);

  // Writes the scroll offset for the landed index, restores Lenis and hands the
  // position back to the scroll handler.
  const settle = useCallback((index) => {
    springRaf.current = 0;
    const y = scrollYForIndex(index);
    if (y != null) window.scrollTo(0, y); // Lenis is stopped, so this sticks
    modeRef.current = 'scroll';
    lenisRef?.current?.start();
  }, [scrollYForIndex, lenisRef]);

  // §4 — damping-ratio / response spring, integrated by hand.
  const startSpring = useCallback((target, initialVelocity) => {
    cancelSpring();
    modeRef.current = 'spring';
    const omega = (2 * Math.PI) / SPRING_RESPONSE;
    let v = initialVelocity;
    let last = performance.now();

    const step = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000); // clamp so a stall cannot explode it
      last = now;
      const x = positionRef.current;
      const a = -omega * omega * (x - target) - 2 * SPRING_DAMPING * omega * v;
      v += a * dt;
      setPosition(x + v * dt);

      if (Math.abs(positionRef.current - target) < 0.001 && Math.abs(v) < 0.001) {
        setPosition(target);
        settle(target);
        return;
      }
      schedule();
    };
    function schedule() { springRaf.current = requestAnimationFrame(step); }

    schedule();
  }, [cancelSpring, setPosition, settle]);

  // Unmounting mid-gesture must never leave Lenis stopped.
  useEffect(() => () => {
    cancelSpring();
    lenisRef?.current?.start();
  }, [cancelSpring, lenisRef]);

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
      if (modeRef.current !== 'scroll') return; // the gesture owns the position
      const wrap = wrapRef.current;
      const pin = pinRef.current;
      if (!wrap || !pin) return;
      const travel = wrap.offsetHeight - pin.offsetHeight;
      const progress = Math.max(0, Math.min(1, (STICKY_TOP - wrap.getBoundingClientRect().top) / travel));
      setPosition(progress * (count - 1));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    applyTiles(positionRef.current);
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pinned, count, applyTiles, setPosition]);

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
    if (!pinned) {
      drag.current = { startX: event.clientX, startT: event.timeStamp, active: true, moved: false };
      return;
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // capture is an enhancement, not a requirement
    }
    cancelSpring(); // §3 — interrupt, do not queue
    lenisRef?.current?.stop();
    drag.current = {
      active: true,
      moved: false,
      committed: false,
      startX: event.clientX,
      startY: event.clientY,
      startPos: positionRef.current, // §3 — start from the PRESENTATION value
      samples: [{ x: event.clientX, t: event.timeStamp }],
    };
    modeRef.current = 'drag';
  };

  const onPointerMove = (event) => {
    const d = drag.current;
    if (!d.active) return;
    if (!pinned) {
      if (Math.abs(event.clientX - d.startX) > 6) d.moved = true;
      return;
    }
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;

    if (!d.committed) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > DRAG_THRESHOLD_PX) {
        // vertical intent — hand the gesture back to the page
        d.active = false;
        lenisRef?.current?.start();
        modeRef.current = 'scroll';
        return;
      }
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return; // §10 hysteresis
      d.committed = true;
    }

    d.moved = true;
    d.samples.push({ x: event.clientX, t: event.timeStamp });
    if (d.samples.length > 6) d.samples.shift(); // §2 — short history, for velocity

    setPosition(withRubberband(d.startPos - dx / DRAG_PX_PER_SLIDE));
  };

  const endDrag = (event) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;

    if (!pinned) {
      const dx = event.clientX - d.startX;
      const dt = Math.max(1, event.timeStamp - d.startT);
      const velocity = Math.abs(dx) / dt;
      if (Math.abs(dx) >= SWIPE_PX || (velocity > SWIPE_VELOCITY && Math.abs(dx) > 8)) {
        (dx < 0 ? next : prev)();
      }
      return;
    }

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // the capture may already be gone
    }

    if (!d.committed) { lenisRef?.current?.start(); modeRef.current = 'scroll'; return; }

    // px/ms over the recent samples, then slides/s
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const vPx = (last.x - first.x) / dt; // px per ms
    const vSlides = -(vPx * 1000) / DRAG_PX_PER_SLIDE; // slides per second

    // §6 — project where the flick is GOING, do not snap from where it stopped
    const projected = positionRef.current + ((vSlides / 1000) * DECELERATION) / (1 - DECELERATION);
    const target = Math.max(0, Math.min(count - 1, Math.round(projected)));

    startSpring(target, vSlides); // §5 — carry the velocity in
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
              style={pinned ? undefined : tileTransform(offset, reduced)}
              ref={(el) => { tileRefs.current[i] = el; }}
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
