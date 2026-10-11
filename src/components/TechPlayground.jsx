import React, { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useReducedMotion, useIsoLayoutEffect } from '../lib/motion';
import { createBallWorld } from '../lib/ballPhysics';
import { SKILL_BALLS } from '../lib/skillBalls';

// Desktop gets real WebGL spheres; phones (or no WebGL) get shaded DOM balls
// driven by the same physics.
const GL_QUERY = '(min-width: 769px)';
const DROP_STAGGER = 0.07;

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

const pickMode = () =>
  typeof window !== 'undefined' && window.matchMedia(GL_QUERY).matches && hasWebGL() ? 'gl' : 'dom';

const TechPlayground = () => {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const scatterRef = useRef(null);
  const reduced = useReducedMotion();
  const [mode, setMode] = useState(pickMode);

  useIsoLayoutEffect(() => {
    const stage = stageRef.current;
    if (reduced || !stage) return undefined;

    const world = createBallWorld({
      count: SKILL_BALLS.length,
      width: stage.clientWidth,
      height: stage.clientHeight,
    });
    const domBalls = Array.from(stage.querySelectorAll('.tech-ball'));
    const domLogos = domBalls.map((el) => el.firstElementChild);
    let renderer = null;
    let disposed = false;

    const draw = () => {
      if (renderer) {
        renderer.render(world.balls);
        return;
      }
      world.balls.forEach((b, i) => {
        const el = domBalls[i];
        if (!el) return;
        el.style.visibility = b.live ? 'visible' : 'hidden';
        if (!b.live) return;
        el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`;
        domLogos[i].style.transform = `rotate(${b.angle}rad)`;
      });
    };

    const sync = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      world.resize(width, height);
      renderer?.resize(width, height);
      stage.style.setProperty('--ball', `${world.balls[0].r * 2}px`);
      draw();
    };

    // Physics + render ride gsap.ticker; step() reports false once everything
    // is at rest, so an idle pile costs nothing.
    const tick = (time, deltaTime) => {
      if (world.step(deltaTime / 1000)) draw();
    };

    let running = false;
    const setRunning = (next) => {
      if (next === running) return;
      running = next;
      if (running) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    };

    const ctx = gsap.context((self) => {
      self.add('dropIn', () => {
        SKILL_BALLS.forEach((_, i) => gsap.delayedCall(i * DROP_STAGGER, () => world.spawn(i)));
      });

      // Balls drop in the first time the box comes into view (also when the
      // page loads already scrolled past it).
      ScrollTrigger.create({
        trigger: stage,
        start: 'top 75%',
        onEnter: (st) => { self.dropIn(); st.kill(); },
        onLeave: (st) => { self.dropIn(); st.kill(); },
      });

      // Only simulate while the box is on screen.
      ScrollTrigger.create({
        trigger: stage,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: ({ isActive }) => setRunning(isActive),
      });
    }, stage);

    const rect = stage.getBoundingClientRect();
    setRunning(rect.top < window.innerHeight && rect.bottom > 0);

    if (mode === 'gl') {
      import('../lib/skillBallsGL').then(({ createSkillBallsGL }) => {
        if (disposed) return;
        renderer = canvasRef.current && createSkillBallsGL(canvasRef.current, SKILL_BALLS);
        if (!renderer) {
          setMode('dom');
          return;
        }
        sync();
      });
    }
    sync();

    const toLocal = (event) => {
      const box = stage.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };

    const onDown = (event) => {
      const p = toLocal(event);
      const ball = world.hit(p.x, p.y);
      if (!ball) return;
      event.preventDefault();
      stage.setPointerCapture?.(event.pointerId);
      world.grab(ball, p.x, p.y);
      stage.classList.add('is-grabbing');
    };

    const onMove = (event) => {
      const p = toLocal(event);
      // Touch only drags; hover repulsion is for mice.
      if (!world.holding && event.pointerType !== 'mouse') return;
      world.move(p.x, p.y);
      if (!world.holding) stage.classList.toggle('is-over-ball', Boolean(world.hit(p.x, p.y)));
    };

    const onUp = () => {
      if (!world.holding) return;
      world.release();
      stage.classList.remove('is-grabbing');
    };

    const onLeave = () => {
      if (world.holding) return;
      world.leave();
      stage.classList.remove('is-over-ball');
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('pointerleave', onLeave);

    const observer = new ResizeObserver(sync);
    observer.observe(stage);

    scatterRef.current = () => world.scatter();

    return () => {
      disposed = true;
      setRunning(false);
      observer.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('pointerleave', onLeave);
      stage.classList.remove('is-grabbing', 'is-over-ball');
      scatterRef.current = null;
      ctx.revert();
      renderer?.dispose();
    };
  }, [reduced, mode]);

  const showDomBalls = reduced || mode === 'dom';

  return (
    <div className={`tech-playground${reduced ? ' is-static' : ''}`}>
      <div className="tech-playground-head">
        <div className="tech-playground-label">// DRAG_AND_THROW</div>
        <p className="tech-playground-hint">
          {reduced ? 'The stack, all in one place.' : 'Grab a ball and throw it.'}
        </p>
        {!reduced && (
          <button type="button" className="tech-playground-shuffle" onClick={() => scatterRef.current?.()}>
            Shuffle
          </button>
        )}
      </div>
      <div className={`tech-playground-stage is-${reduced ? 'static' : mode}`} ref={stageRef} aria-hidden="true">
        {!reduced && mode === 'gl' && <canvas ref={canvasRef} className="tech-playground-canvas" />}
        {showDomBalls &&
          SKILL_BALLS.map((ball) => (
            <span key={ball.name} className="tech-ball" style={{ '--ball-color': ball.color }}>
              <svg viewBox="0 0 24 24">
                <path d={ball.path} fill={ball.logo} />
              </svg>
            </span>
          ))}
      </div>
    </div>
  );
};

export default TechPlayground;
