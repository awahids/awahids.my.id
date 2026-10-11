# 016 — Give the coverflow a real spring gesture

- **Status**: DONE
- **Commit**: 571037c
- **Severity**: —
- **Category**: Apple fluid interfaces — response (§1), direct manipulation (§2), interruptibility (§3), springs (§4), velocity handoff (§5), momentum projection (§6), rubber-banding (§9), gesture details (§10)
- **Estimated scope**: 3 files, ~130 lines

## Problem

After commit `ad4f56f` the coverflow has a continuous float position and its
tiles are written per frame. What it still lacks is a gesture.

```js
/* src/components/ProjectCoverflow.jsx — current. The finger moves; nothing follows. */
  const onPointerMove = (event) => {
    if (!drag.current.active) return;
    if (Math.abs(event.clientX - drag.current.startX) > 6) drag.current.moved = true;
  };
  const endDrag = (event) => {
    ...
    if (Math.abs(dx) >= SWIPE_PX || (velocity > SWIPE_VELOCITY && Math.abs(dx) > 8)) {
      (dx < 0 ? next : prev)();
    }
  };
```

`onPointerMove` sets a boolean. Nothing tracks the pointer, so there is no
continuous feedback during the interaction (§1) and no 1:1 manipulation (§2).
At release the component decides a discrete outcome and hands off to
`window.scrollTo`, so there is no velocity handoff (§5), no momentum projection
(§6) and no boundary resistance (§9).

## Target

A three-mode state machine on a ref, `modeRef.current`:

| Mode | Who owns `positionRef` | Lenis |
| --- | --- | --- |
| `'scroll'` | the existing scroll rAF handler | running |
| `'drag'` | the pointer, 1:1 | stopped |
| `'spring'` | the spring rAF loop | stopped |

Only the pinned path uses it. When `pinned` is false the component is in
reduced motion or has a single project — keep today's commit-on-release
behaviour untouched there, since §14 says reduced motion should not get
momentum or springs.

### Constants

```js
const DRAG_PX_PER_SLIDE = 170;  // the active tile's own travel for one slide
const DRAG_THRESHOLD_PX = 10;   // §10 hysteresis before the carousel commits
const DECELERATION = 0.998;     // §6, Apple's normal scroll feel
const SPRING_DAMPING = 0.8;     // §4, momentum-driven so a little bounce is right
const SPRING_RESPONSE = 0.35;   // §4, seconds
const RUBBER_CONSTANT = 0.55;   // §9
```

### §2 — 1:1 tracking with pointer capture

```js
const onPointerDown = (event) => {
  if (!pinned) { /* keep the existing non-pinned path */ return; }
  event.currentTarget.setPointerCapture(event.pointerId);
  cancelSpring();                               // §3 — interrupt, do not queue
  lenisRef?.current?.stop();
  drag.current = {
    active: true, moved: false, committed: false,
    startX: event.clientX, startY: event.clientY,
    startPos: positionRef.current,              // §3 — start from the PRESENTATION value
    samples: [{ x: event.clientX, t: event.timeStamp }],
  };
  modeRef.current = 'drag';
};
```

`startPos` reads the live on-screen position, so grabbing a moving carousel
continues from where it visually is rather than snapping to a logical value.

```js
const onPointerMove = (event) => {
  const d = drag.current;
  if (!d.active) return;
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
    if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;   // §10 hysteresis
    d.committed = true;
  }

  d.moved = true;
  d.samples.push({ x: event.clientX, t: event.timeStamp });
  if (d.samples.length > 6) d.samples.shift();      // §2 — short history, for velocity

  setPosition(withRubberband(d.startPos - dx / DRAG_PX_PER_SLIDE));
};
```

Dragging left must advance the carousel, hence `startPos - dx / …`.

`.pcf-stage` already carries `touch-action: pan-y` (`src/index.css:1567`), so a
vertical swipe still scrolls the page natively. The axis check above is the
belt-and-braces half of that.

### §9 — rubber-banding at the ends

```js
const rubberband = (overshoot, dimension = 1, constant = RUBBER_CONSTANT) =>
  (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));

const withRubberband = (raw) => {
  const max = count - 1;
  if (raw < 0) return -rubberband(-raw);
  if (raw > max) return max + rubberband(raw - max);
  return raw;
};
```

The dimension is one slide. Half a slide of overshoot yields about 0.22 — the
carousel keeps following, but visibly resists.

### §5 + §6 — release: project, then hand off velocity

```js
const endDrag = (event) => {
  const d = drag.current;
  if (!d.active) return;
  d.active = false;
  event.currentTarget.releasePointerCapture?.(event.pointerId);

  if (!d.committed) { lenisRef?.current?.start(); modeRef.current = 'scroll'; return; }

  // px/ms over the recent samples, then slides/s
  const first = d.samples[0];
  const last = d.samples[d.samples.length - 1];
  const dt = Math.max(1, last.t - first.t);
  const vPx = (last.x - first.x) / dt;                       // px per ms
  const vSlides = -(vPx * 1000) / DRAG_PX_PER_SLIDE;         // slides per second

  // §6 — project where the flick is GOING, do not snap from where it stopped
  const projected = positionRef.current + (vSlides / 1000) * DECELERATION / (1 - DECELERATION);
  const target = Math.max(0, Math.min(count - 1, Math.round(projected)));

  startSpring(target, vSlides);                              // §5 — carry the velocity in
};
```

The sign flip on `vSlides` matches the drag mapping: moving the finger left is
negative `dx` but increasing position.

### §4 — the spring

A damping-ratio/response spring, integrated in its own rAF loop. Apple's
parameters, not mass/stiffness/damping.

```js
const startSpring = (target, initialVelocity) => {
  cancelSpring();
  modeRef.current = 'spring';
  const omega = (2 * Math.PI) / SPRING_RESPONSE;
  let v = initialVelocity;
  let last = performance.now();

  const step = (now) => {
    const dt = Math.min(0.032, (now - last) / 1000);   // clamp so a stall cannot explode it
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
    springRaf.current = requestAnimationFrame(step);
  };
  springRaf.current = requestAnimationFrame(step);
};
```

`settle(target)` writes the scroll position for that index, restores Lenis, and
returns to `'scroll'` mode:

```js
const settle = (index) => {
  springRaf.current = 0;
  const y = scrollYForIndex(index);
  if (y != null) window.scrollTo(0, y);   // Lenis is stopped, so this sticks
  modeRef.current = 'scroll';
  lenisRef?.current?.start();
};
```

Extract `scrollYForIndex(index)` from the existing `scrollToIndex`, which
already computes exactly this, and have `scrollToIndex` call it. Because the
position already equals the index, the scroll handler recomputing from the new
scroll offset produces the same value — no jump.

### Shared position writer

```js
const setPosition = (pos) => {
  positionRef.current = pos;
  applyTiles(pos);
  const rounded = Math.max(0, Math.min(count - 1, Math.round(pos)));
  if (rounded !== activeIndexRef.current) {
    activeIndexRef.current = rounded;
    setActiveIndex(rounded);
  }
};
```

`applyTiles` and the rounded-index guard already exist from `ad4f56f` — reuse
them, do not duplicate.

### The scroll handler must stand down

```js
/* in the existing scroll rAF update(), first line */
      if (modeRef.current !== 'scroll') return;
```

### Wiring `lenisRef`

`ProjectCoverflow` is rendered by `src/components/Portfolio.jsx:444`, which is
rendered by `src/App.jsx:483`. Thread the ref through both, following the
convention already used at `src/App.jsx:484` for `<Skills lenisRef={lenisRef} />`:

```jsx
/* src/App.jsx */      <Portfolio lenisRef={lenisRef} />
/* src/components/Portfolio.jsx */  const Portfolio = ({ lenisRef }) => { …
                                    <ProjectCoverflow projects={projects} onOpen={openModal} lenisRef={lenisRef} />
```

Every Lenis call must be optional-chained. Lenis is disabled on some routes, so
`lenisRef` or `lenisRef.current` can be null and the gesture must still work.

## Repo conventions to follow

- `src/App.jsx:484` already passes `lenisRef` to a component — imitate it.
- The component already branches on `reduced` and on `pinned = !reduced && count > 1`.
- `applyTiles`, `positionRef` and `activeIndexRef` landed in `ad4f56f`.
- `src/index.css:1567` already sets `touch-action: pan-y` on `.pcf-stage`.

## Steps

1. Thread `lenisRef` from `src/App.jsx:483` through `src/components/Portfolio.jsx:444`
   into `ProjectCoverflow`.
2. Add the constants, `modeRef`, `springRaf` and the `rubberband` / `withRubberband`
   helpers.
3. Extract `scrollYForIndex(index)` from `scrollToIndex`; have `scrollToIndex` use it.
4. Add `setPosition`, `cancelSpring`, `startSpring` and `settle`.
5. Rewrite `onPointerDown`, `onPointerMove` and `endDrag` per the Target section,
   keeping the existing non-pinned path intact behind `if (!pinned)`.
6. Add the `modeRef.current !== 'scroll'` guard to the scroll rAF update.
7. Cancel `springRaf` and call `lenisRef?.current?.start()` in the component's
   cleanup, so unmounting mid-gesture cannot leave Lenis stopped forever.

## Boundaries

- Do NOT change `tileTransform`, `applyTiles` or the tile render.
- Do NOT touch `src/index.css`. `touch-action` is already correct and the tile
  transitions were removed in `ad4f56f`.
- Do NOT change `goTo`, `prev`, `next` or the keyboard handler — the arrow
  buttons and keyboard keep using the scroll path.
- Do NOT add a spring to the non-pinned (reduced-motion) path.
- Do NOT use a CSS transition anywhere in this gesture. §3 forbids it.
- Do NOT call `setActiveIndex` per frame — go through `setPosition`.
- Do NOT add dependencies. Write the spring by hand; framer-motion is present
  but its springs animate DOM values, not a scalar we already own.
- Do NOT leave Lenis stopped on any early-return path. Every exit from `'drag'`
  or `'spring'` must restore it.
- If `setPointerCapture` throws (some browsers on synthetic events), catch and
  continue — capture is an enhancement, not a requirement.

## Verification

- **Mechanical**:
  - `npm run lint`, `npm run build`, `npm test` — clean, 77 pass.
  - `grep -n "lenisRef" src/App.jsx src/components/Portfolio.jsx src/components/ProjectCoverflow.jsx`
    — expect the ref threaded through all three.
  - `grep -c "requestAnimationFrame" src/components/ProjectCoverflow.jsx` — expect
    2 (the scroll handler and the spring).
- **Feel check**: run `npm run dev`, scroll to the projects section.
  - **1:1** — press and drag slowly without releasing. The tiles must follow the
    finger continuously and stop when the finger stops. This is the headline
    check; before this change nothing moved until release.
  - **Reverse mid-drag** — drag left, then right, without releasing. The
    carousel must follow both ways with no snap-back.
  - **Interrupt** — flick, then grab again while it is still settling. It must
    continue from where it visually is, not jump. §3.
  - **Momentum** — a hard flick must travel further than a gentle one, and land
    on a further slide. A short slow drag must fall back to where it started.
  - **Rubber-band** — at the first slide, drag right. It must keep moving but
    resist progressively, then spring back on release. It must NOT hard-stop,
    and it must NOT scroll the page.
  - **Vertical** — on a touch viewport, swipe vertically over the stage. The
    page must scroll normally and the carousel must not move.
  - **Tap** — tap a side tile. It must still navigate to it, and tapping the
    active tile must still open the modal. A tap must not nudge the carousel.
  - **Lenis restored** — after any gesture, scroll the page normally. If it
    feels jerky or unresponsive, Lenis was left stopped on some path.
  - Arrow buttons, dots and arrow keys must behave exactly as before.
  - In DevTools → Performance, record a flick and confirm no layout entries and
    no React commit per frame.
  - With reduced motion emulated, confirm none of this engages.
- **Done when**: the tiles track the finger 1:1, a flick projects and springs to
  a further slide, the ends resist and spring back, a settling carousel can be
  grabbed mid-flight, and normal scrolling still works afterwards.
