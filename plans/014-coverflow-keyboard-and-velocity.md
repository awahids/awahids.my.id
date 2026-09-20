# 014 — Make the coverflow keyboard instant and its swipe velocity-aware

- **Status**: DONE
- **Commit**: b132b95
- **Severity**: MEDIUM
- **Category**: Purpose & frequency (§1), Interruptibility (§4)
- **Estimated scope**: 1 file, ~25 lines

## Problem

### A. A keyboard action that animates

The playbook's frequency table is explicit: **keyboard shortcuts → no animation,
ever.**

```js
/* src/components/ProjectCoverflow.jsx:96-101 — current */
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    };
    stage.addEventListener('keydown', onKeyDown);
```

`prev`/`next` reach `goTo`, which when pinned calls:

```js
/* src/components/ProjectCoverflow.jsx:35-41 — current */
  const scrollToIndex = useCallback((index) => {
    const wrap = pinRef.current && wrapRef.current;
    if (!wrap) return;
    const travel = wrapRef.current.offsetHeight - pinRef.current.offsetHeight;
    const top = wrapRef.current.getBoundingClientRect().top + window.scrollY - STICKY_TOP + (index / (count - 1)) * travel;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [count]);
```

So one arrow press starts a smooth scroll **and** a 0.7s tile transition. Held
arrow keys queue animations against each other.

### B. A swipe that ignores how fast you flicked

```js
/* src/components/ProjectCoverflow.jsx:4, 104-116 — current */
const SWIPE_PX = 48;

  const onPointerDown = (event) => {
    drag.current = { startX: event.clientX, active: true, moved: false };
  };
  const onPointerMove = (event) => {
    if (!drag.current.active) return;
    if (Math.abs(event.clientX - drag.current.startX) > 6) drag.current.moved = true;
  };
  const endDrag = (event) => {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    drag.current.active = false;
    if (Math.abs(dx) >= SWIPE_PX) (dx < 0 ? next : prev)();
  };
```

No timestamp is recorded at pointer-down, so velocity cannot be computed at all.
A fast flick shorter than 48px does nothing, which is the single most common
complaint about distance-only carousels.

## Target

### A. Keyboard jumps instantly

Give `goTo` an `animate` flag, defaulting to the current behaviour, and pass
`false` from the keyboard handler.

```js
/* target — scrollToIndex gains a behavior argument */
  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    const wrap = pinRef.current && wrapRef.current;
    if (!wrap) return;
    const travel = wrapRef.current.offsetHeight - pinRef.current.offsetHeight;
    const top = wrapRef.current.getBoundingClientRect().top + window.scrollY - STICKY_TOP + (index / (count - 1)) * travel;
    window.scrollTo({ top, behavior });
  }, [count]);
```

```js
/* target — goTo threads it through */
  const goTo = useCallback((index, animate = true) => {
    const i = Math.max(0, Math.min(count - 1, index));
    if (pinned) scrollToIndex(i, animate ? 'smooth' : 'auto');
    else setActiveIndex(i);
  }, [count, pinned, scrollToIndex]);
```

```js
/* target — the keyboard handler asks for no animation */
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(activeIndex - 1, false); }
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(activeIndex + 1, false); }
    };
```

`behavior: 'auto'` is the instant value. Keep `prev`/`next` as they are for the
on-screen buttons, which should still animate.

Note the effect at ~96 currently depends on `[prev, next]`; after this change it
depends on `[goTo, activeIndex]`. Update the dependency array or the handler
will close over a stale index.

### B. Velocity-aware dismissal

The playbook: dismiss when `Math.abs(distance) / elapsedMs > ~0.11`, **not on
distance alone**.

```js
/* target — record the time */
  const onPointerDown = (event) => {
    drag.current = { startX: event.clientX, startT: event.timeStamp, active: true, moved: false };
  };
```

```js
/* target — either a long drag OR a fast flick commits */
const SWIPE_PX = 48;
const SWIPE_VELOCITY = 0.11;   // px per ms

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
```

Exact values: `0.11` px/ms, and an `8`px floor so a fast tap is not read as a
flick. Keep `SWIPE_PX = 48` as the distance path — the velocity test is
additive, not a replacement.

Use `event.timeStamp` rather than `Date.now()`: it comes from the same clock as
the pointer events, so the delta is accurate even under main-thread jank.

## Deliberately out of scope

The audit also found that the tiles do not follow the finger during the drag
(they jump after release) and that the index is clamped with no rubber-band at
the ends. Both are real, and both are **excluded here**.

Live finger tracking means driving `.pcf-tile` transforms per pointer-move
instead of by CSS class, which replaces the component's entire rendering
strategy and needs a spring to resolve the gesture — a rewrite, not a fix.
Rubber-banding depends on that same per-frame transform pipeline. They belong
in their own plan, after this one proves the gesture reads correctly.

The 0.7s tile transition is handled by plan 013, not here.

## Repo conventions to follow

- The component already branches on reduced motion:
  `src/components/ProjectCoverflow.jsx:8` returns `transform: 'none'` from
  `tileTransform` when `reduced` is true. Do not add a second branch.
- Module-level constants live at the top of the file beside
  `const SWIPE_PX = 48;` and `const STICKY_TOP = 72;`. Add `SWIPE_VELOCITY`
  there.

## Steps

1. Add `const SWIPE_VELOCITY = 0.11;` beside `SWIPE_PX` at the top of the file.
2. Give `scrollToIndex` a `behavior = 'smooth'` parameter and pass it to
   `window.scrollTo`.
3. Give `goTo` an `animate = true` parameter and pass
   `animate ? 'smooth' : 'auto'` to `scrollToIndex`.
4. Rewrite `onKeyDown` to call `goTo(activeIndex ± 1, false)`, and update that
   `useEffect`'s dependency array to `[goTo, activeIndex]`.
5. Add `startT: event.timeStamp` to the object `onPointerDown` assigns.
6. Rewrite `endDrag` per the Target section.

## Boundaries

- Do NOT change `prev` or `next` — the on-screen arrow buttons must still
  animate.
- Do NOT touch `onPointerMove` or `onClickCapture`. The `moved` flag is what
  suppresses a click after a drag; breaking it makes tiles un-clickable.
- Do NOT change `SWIPE_PX` from 48.
- Do NOT attempt live finger tracking or rubber-banding. See "Deliberately out
  of scope".
- Do NOT touch `src/index.css`.
- Do NOT add dependencies.
- If `goTo` is called from somewhere this plan does not list, check that the new
  second parameter defaults correctly for that caller before editing.

## Verification

- **Mechanical**:
  - `npm run lint` — zero errors, **and no exhaustive-deps warning** for the
    keyboard effect.
  - `npm run build`, `npm test` — clean, 77 pass.
  - `grep -n "SWIPE_VELOCITY" src/components/ProjectCoverflow.jsx` — expect two
    matches (declaration and use).
  - `grep -n "startT" src/components/ProjectCoverflow.jsx` — expect two matches.
- **Feel check**: run `npm run dev` and scroll to the projects coverflow.
  - **Keyboard**: click the stage to focus it, then press Right arrow. The
    change must be **instant** — no scroll animation. Hold the arrow key down
    and confirm it steps cleanly without queueing or stuttering. This is the
    primary check.
  - **Buttons**: click the on-screen arrows and confirm they still animate.
    If they became instant too, the `animate` default was applied wrongly.
  - **Slow drag** (mobile emulation, or a mouse drag): drag more than ~48px
    slowly and release — it should advance, as before.
  - **Fast flick**: flick quickly across only ~20px and release. **Before this
    change nothing happened; now it must advance.** That is the whole point.
  - **Fast tap**: tap without moving. It must NOT advance — the 8px floor
    prevents it. If a plain tap now changes slides, the floor is missing.
  - **Click-through**: after dragging, confirm a tile does not also register a
    click and navigate away.
  - With reduced motion emulated, confirm tiles still switch with no transform
    animation.
- **Done when**: arrow keys change slides instantly, a short fast flick
  advances, a stationary tap does not, and the on-screen buttons still animate.
