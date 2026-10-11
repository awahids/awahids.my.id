/**
 * ballPhysics — a tiny 2D ball world for the Skills playground, in CSS pixels
 * (y points down). Gravity, wall + ball-to-ball bounces, rolling spin, a
 * grabbable ball that is thrown with the pointer's velocity, and pointer
 * repulsion. Renderer-agnostic: WebGL and DOM both read `balls`.
 *
 * Kept deliberately small: 20 balls → 190 pair checks per substep.
 */
const GRAVITY = 2600;
const WALL_BOUNCE = 0.5;
const BALL_BOUNCE = 0.6;
const FLOOR_FRICTION = 3.2; // per second, while resting on the floor
const AIR_DRAG = 0.15;
const MAX_SPEED = 3200;
const REPEL_RADIUS = 120;
const REPEL_FORCE = 2600;
const SLEEP_SPEED = 6;
const SUBSTEPS = 2;

export const createBallWorld = ({ count, width, height }) => {
  let w = width;
  let h = height;
  let held = null; // { ball, x, y, vx, vy }
  let pointer = null; // repulsion source while hovering
  let asleep = false;

  const radiusFor = () => Math.max(22, Math.min(46, w / 24));

  const balls = Array.from({ length: count }, (_, index) => ({
    index,
    r: radiusFor(),
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    live: false, // not yet dropped in
  }));

  const wake = () => { asleep = false; };

  const spawn = (ball) => {
    ball.x = ball.r + Math.random() * Math.max(1, w - ball.r * 2);
    ball.y = -ball.r - Math.random() * 160;
    ball.vx = (Math.random() - 0.5) * 300;
    ball.vy = 0;
    ball.live = true;
    wake();
  };

  const integrate = (dt) => {
    let fastest = 0;

    for (const b of balls) {
      if (!b.live) continue;

      if (held?.ball === b) {
        // Follow the pointer; remember its velocity for the throw.
        const nx = held.x;
        const ny = held.y;
        b.vx = (nx - b.x) / dt;
        b.vy = (ny - b.y) / dt;
        b.x = nx;
        b.y = ny;
      } else {
        b.vy += GRAVITY * dt;

        if (pointer) {
          const dx = b.x - pointer.x;
          const dy = b.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.01 && dist < REPEL_RADIUS + b.r) {
            const push = (1 - dist / (REPEL_RADIUS + b.r)) * REPEL_FORCE * dt;
            b.vx += (dx / dist) * push;
            b.vy += (dy / dist) * push;
          }
        }

        const drag = 1 - AIR_DRAG * dt;
        b.vx *= drag;
        b.vy *= drag;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      // Walls. Balls may enter from above the box, so no ceiling while spawning.
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * WALL_BOUNCE; }
      else if (b.x > w - b.r) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * WALL_BOUNCE; }
      if (b.y > h - b.r) {
        b.y = h - b.r;
        b.vy = -Math.abs(b.vy) * WALL_BOUNCE;
        if (Math.abs(b.vy) < 40) b.vy = 0;
        b.vx *= 1 - FLOOR_FRICTION * dt;
      } else if (b.y < b.r && b.vy < 0 && held?.ball !== b) {
        b.y = b.r;
        b.vy = Math.abs(b.vy) * WALL_BOUNCE;
      }

      const speed = Math.hypot(b.vx, b.vy);
      if (speed > MAX_SPEED) {
        b.vx *= MAX_SPEED / speed;
        b.vy *= MAX_SPEED / speed;
      }
      fastest = Math.max(fastest, speed);
    }

    // Ball-to-ball: separate overlaps, then exchange velocity along the normal.
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (!a.live) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (!b.live) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;

        const dist = Math.sqrt(d2);
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = min - dist;
        // A held ball is immovable: it shoves, it doesn't get shoved.
        const wa = held?.ball === a ? 0 : held?.ball === b ? 1 : 0.5;
        const wb = 1 - wa;
        a.x -= nx * overlap * wa;
        a.y -= ny * overlap * wa;
        b.x += nx * overlap * wb;
        b.y += ny * overlap * wb;

        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) {
          const impulse = -(1 + BALL_BOUNCE) * rel;
          a.vx -= impulse * nx * wa;
          a.vy -= impulse * ny * wa;
          b.vx += impulse * nx * wb;
          b.vy += impulse * ny * wb;
        }
      }
    }

    // Rolling: spin follows horizontal travel.
    for (const b of balls) {
      if (b.live) b.angle += (b.vx / b.r) * dt;
    }

    return fastest;
  };

  return {
    balls,

    /** Advance the world; returns false once everything has come to rest. */
    step(dt) {
      if (asleep && !held && !pointer) return false;
      const sub = Math.min(dt, 1 / 30) / SUBSTEPS;
      let fastest = 0;
      for (let s = 0; s < SUBSTEPS; s++) fastest = Math.max(fastest, integrate(sub));
      const allIn = balls.every((b) => b.live);
      asleep = allIn && !held && !pointer && fastest < SLEEP_SPEED;
      return true;
    },

    /** Drop the balls in one by one (call with increasing delays). */
    spawn(index) {
      const ball = balls[index];
      if (ball && !ball.live) spawn(ball);
    },

    hit(x, y) {
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (b.live && Math.hypot(b.x - x, b.y - y) <= b.r) return b;
      }
      return null;
    },

    grab(ball, x, y) {
      held = { ball, x, y };
      pointer = null;
      wake();
    },

    move(x, y) {
      if (held) {
        held.x = Math.max(held.ball.r, Math.min(w - held.ball.r, x));
        held.y = Math.max(held.ball.r, Math.min(h - held.ball.r, y));
      } else {
        pointer = { x, y };
      }
      wake();
    },

    release() {
      held = null;
      wake();
    },

    leave() {
      pointer = null;
      if (held) held = null;
      wake();
    },

    get holding() {
      return Boolean(held);
    },

    /** Fling everything up into the air. */
    scatter() {
      for (const b of balls) {
        if (!b.live) spawn(b);
        b.vx = (Math.random() - 0.5) * 1400;
        b.vy = -900 - Math.random() * 900;
      }
      wake();
    },

    resize(width2, height2) {
      w = width2;
      h = height2;
      const r = radiusFor();
      for (const b of balls) {
        b.r = r;
        b.x = Math.max(r, Math.min(w - r, b.x));
        if (b.live) b.y = Math.min(h - r, b.y);
      }
      wake();
    },
  };
};
