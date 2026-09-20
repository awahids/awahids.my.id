# 015 — Make the coverflow position continuous instead of a rounded index

- **Status**: DONE
- **Commit**: 5b91023
- **Severity**: —
- **Category**: Apple-style fluidity — response (§1), behavior over animation (§4), frame-level smoothness (§11)
- **Estimated scope**: 2 files, ~50 lines

## Problem

The pinned coverflow is scroll-driven, but it throws away the fractional part of
its scroll progress:

```js
/* src/components/ProjectCoverflow.jsx:61-62 — current */
      const progress = Math.max(0, Math.min(1, (STICKY_TOP - wrap.getBoundingClientRect().top) / travel));
      setActiveIndex(Math.round(progress * (count - 1)));
```

So the position is an **integer**. Tiles jump between discrete arrangements, and
what animates them is a CSS transition:

```css
/* src/index.css:1657-1659 — current */
  transition:transform var(--tr-base) var(--ease-standard),
             opacity var(--tr-base) ease,
             filter var(--tr-base) ease;
```

Two consequences. Scrolling through the section does not move the tiles
continuously — it steps them, then eases each step, so the motion is decoupled
from the input driving it. And because a CSS transition owns `transform`, the
motion cannot be grabbed and redirected mid-flight, which is what any future
gesture work needs.

This plan makes the position continuous. It does **not** add 1:1 finger
tracking or a release spring — those need programmatic control of Lenis, which
owns page scroll (`src/App.jsx:210`), and are deliberately left for a follow-up.
The drag keeps today's commit-on-release behaviour.

## Target

### A. A float position, written per frame, without React re-rendering

```js
/* target — inside the existing scroll rAF handler */
      const progress = Math.max(0, Math.min(1, (STICKY_TOP - wrap.getBoundingClientRect().top) / travel));
      const pos = progress * (count - 1);          // float, no rounding
      positionRef.current = pos;
      applyTiles(pos);
      const rounded = Math.round(pos);
      if (rounded !== activeIndexRef.current) {
        activeIndexRef.current = rounded;
        setActiveIndex(rounded);                   // caption, dots, aria — changes rarely
      }
```

`setActiveIndex` must fire **only when the rounded value changes**, never per
frame. Per-frame React re-renders are the thing this plan exists to avoid.

`applyTiles` writes each tile's style directly through a ref array:

```js
/* target */
  const tileRefs = useRef([]);
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
```

### B. `tileTransform` must be continuous

The current function has two discontinuities that are invisible at integer
offsets and obvious once the offset is a float.

```js
/* src/components/ProjectCoverflow.jsx:15 — current. Jumps 0 → 100 as |offset|
   crosses 0, because the 170 is a fixed first step. */
  const x = dir * (abs === 0 ? 0 : 170 + (abs - 1) * 70);

/* src/components/ProjectCoverflow.jsx:17 — current. Drops 0.34 → 0 at |offset| = 3. */
  const opacity = abs >= 3 ? 0 : 1 - abs * 0.22;
```

```js
/* target — piecewise-linear, continuous, and IDENTICAL at every integer */
  const x = dir * (abs <= 1 ? 170 * abs : 170 + (abs - 1) * 70);

/* target — fades to zero over the last half step instead of snapping */
  const fade = abs >= 3 ? 0 : Math.min(1, (3 - abs) / 0.5);
  const opacity = Math.max(0, 1 - abs * 0.22) * fade;
```

Verify the equivalence yourself before moving on: at `abs` 0, 1, 2 the new
`x` gives 0, 170, 240 and the new `opacity` gives 1, 0.78, 0.56 — the same
values the current code produces. Only the space between integers changes.

`zIndex` must stay an integer: `Math.round(10 - abs)`.
`rotate` and `z` are already continuous — leave them.

### C. React stops owning the positional style while pinned

When pinned, the rAF handler owns `transform`, `opacity`, `zIndex` and
`pointerEvents`. React must not also write them, or every `setActiveIndex`
re-render would stamp the discrete value back over the continuous one and cause
a visible jump.

```jsx
/* target — the tile's style prop */
style={pinned ? undefined : tileTransform(i - activeIndex, reduced)}
ref={(el) => { tileRefs.current[i] = el; }}
```

Non-pinned (reduced motion, or a single project) keeps today's React-driven
path untouched.

Call `applyTiles(positionRef.current)` once on mount, after refs are attached,
so the tiles are positioned before the first scroll event.

### D. Drop the transitions the rAF now owns

```css
/* target — src/index.css, .pcf-tile */
  transition:filter var(--tr-base) ease;
```

`filter` stays: it is driven by the `.is-active` class
(`src/index.css:1673`, the drop-shadow glow), not per frame. `transform` and
`opacity` legs go, because a transition on a property rewritten every frame
restarts every frame and double-smooths the motion.

Leave the reduced-motion override at ~1761 exactly as it is — under reduced
motion `pinned` is false, no per-frame writes happen, and that block's opacity
transition is still correct.

## Repo conventions to follow

- Motion tokens at `src/index.css:27-30`.
- The component already branches on `reduced` via `tileTransform(offset, reduced)`
  and `pinned = !reduced && count > 1`. Keep that shape.
- The scroll handler already throttles with `requestAnimationFrame`
  (`ProjectCoverflow.jsx:53-64`). Extend it; do not add a second loop.

## Steps

1. Rewrite `tileTransform`'s `x`, `opacity` and `zIndex` per target B. Confirm
   the integer values are unchanged and report the numbers you checked.
2. Add `positionRef`, `activeIndexRef` and `tileRefs`, plus the `applyTiles`
   callback from target A.
3. In the existing scroll rAF `update` function, stop rounding, store the float,
   call `applyTiles`, and guard `setActiveIndex` behind a changed-rounded-value
   check.
4. Attach `ref` to each tile and make its `style` prop conditional per target C.
5. Call `applyTiles` once after mount when pinned.
6. Apply the CSS change in target D.

## Boundaries

- Do NOT add 1:1 drag tracking, a release spring, momentum projection or
  rubber-banding. Those are the follow-up and need Lenis control.
- Do NOT change `onPointerDown`, `onPointerMove`, `endDrag` or `onClickCapture`.
- Do NOT change `goTo`, `scrollToIndex`, `prev`, `next` or the keyboard handler.
- Do NOT touch `src/App.jsx` or `src/lib/useLenis.js`.
- Do NOT call `setActiveIndex` on every frame.
- Do NOT add `will-change` to the tiles — they already have
  `backface-visibility:hidden` and are transform-only.
- Do NOT change the reduced-motion path.
- Do NOT add dependencies.
- If removing React's style prop while pinned causes tiles to render unpositioned
  on first paint, fix it with the mount-time `applyTiles` call from step 5 — do
  not reintroduce the React-driven transform.

## Verification

- **Mechanical**:
  - `npm run lint`, `npm run build`, `npm test` — clean, 77 pass.
  - `grep -n "Math.round(progress" src/components/ProjectCoverflow.jsx` — expect
    no output.
  - `grep -n "transition:transform var(--tr-base)" src/index.css` — expect no
    output for `.pcf-tile`.
- **Feel check**: run `npm run dev` and scroll slowly through the projects
  section.
  - Tiles must move **continuously** with the scroll, not step between
    positions. This is the whole point — scroll one notch at a time and confirm
    the tiles drift rather than jump-and-ease.
  - Scroll back and forth quickly. The motion must track the scroll in both
    directions with no lag or settle-then-correct.
  - Confirm the caption and the active tile's glow still change at the right
    moment — they are driven by the rounded index and should flip near the
    halfway point between tiles.
  - Confirm the active tile's drop-shadow glow still fades in rather than
    snapping — that transition is deliberately kept.
  - The arrow buttons, the dots and the swipe must behave exactly as before.
  - In DevTools → Performance, record a scroll through the section and confirm
    there is no React re-render per frame — commits should be rare, not 60/s.
  - With reduced motion emulated, confirm the section is not pinned and tiles
    behave as before.
- **Done when**: tiles move continuously with scroll, React commits are rare,
  and every existing control behaves as it did.
