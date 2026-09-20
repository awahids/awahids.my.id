# 011 — Write the Waves cursor transform directly instead of through a parent variable

- **Status**: DONE
- **Commit**: b132b95
- **Severity**: MEDIUM
- **Category**: Performance (§5)
- **Estimated scope**: 1 file, ~6 lines

## Problem

The playbook: **don't drive child transforms via a CSS variable on the parent** —
it recalculates styles for every child. Set `transform` directly on the element.

```js
/* src/components/Waves.jsx:182-183 and 291-292 — current. Two sites. */
            containerRef.current.style.setProperty('--x', mouse.sx + 'px');
            containerRef.current.style.setProperty('--y', mouse.sy + 'px');
```

```jsx
/* src/components/Waves.jsx:335 — the consumer */
                    transform: 'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)',
```

Every pointer move writes two custom properties on the container, which
invalidates style for the whole subtree, to move one child. Writing the child's
`transform` directly touches one element.

## Target

Hold a ref to the element that consumes `--x`/`--y`, and write its transform
directly.

```jsx
/* target — add a ref alongside the existing refs near the top of the component */
const cursorRef = useRef(null);
```

```jsx
/* target — on the element currently at src/components/Waves.jsx:335, attach the
   ref and drop the var-based transform from its inline style */
ref={cursorRef}
/* remove: transform: 'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)' */
```

```js
/* target — replace BOTH setProperty pairs (182-183 and 291-292) with: */
            if (cursorRef.current) {
              cursorRef.current.style.transform =
                \`translate3d(\${mouse.sx}px, \${mouse.sy}px, 0) translate(-50%, -50%)\`;
            }
```

The `translate(-50%, -50%)` suffix reproduces what `calc(var(--x) - 50%)` did:
the original subtracted 50% **of the element's own size**, which is exactly a
second percentage translate. Do not convert it to pixels.

Order matters — `translate3d` first, then the centring translate — because
transforms apply left to right.

## Repo conventions to follow

- The file already uses refs for the container and the SVG
  (`containerRef`, `svgRef`, `noiseRef`, `rafRef`, `boundingRef`,
  `reducedMotionRef`). Add `cursorRef` in the same cluster, same style.
- `src/lib/useSpotlightGlow.js:20-21` also uses parent `setProperty`, but it
  feeds a `radial-gradient` position, which is paint-only and **not** this
  anti-pattern. Leave it alone.
- `src/components/GlyphPortal.jsx:198-201` has the same pattern for
  `--gp-field-scale`, but that file is scroll-pinned, already handles reduced
  motion, and drives four coupled variables. It is deliberately out of scope —
  do not touch it.

## Steps

1. In `src/components/Waves.jsx`, add `const cursorRef = useRef(null);` beside
   the existing refs.
2. Find the element at ~line 335 whose inline style contains
   `translate3d(calc(var(--x) - 50%), ...)`. Attach `ref={cursorRef}` to it and
   delete that `transform` line from its style object. Leave every other style
   property on that element untouched.
3. Replace the `setProperty('--x'…)` / `setProperty('--y'…)` pair at ~182-183
   with the direct write from the Target section.
4. Replace the identical pair at ~291-292 the same way.
5. Confirm no `--x` or `--y` reference remains in the file.

## Boundaries

- Do NOT touch `src/components/GlyphPortal.jsx`.
- Do NOT touch `src/lib/useSpotlightGlow.js`.
- Do NOT change the reduced-motion branch added in commit `7bb977f` — the
  direct write lives on the same code paths the pointer listeners already guard,
  so under reduced motion those listeners are never bound and the transform is
  never written. Verify that is still true after your edit.
- Do NOT change `mouse.sx` / `mouse.sy` or how they are computed.
- Do NOT convert the `-50%` centring to pixels.
- Do NOT add dependencies.
- If the consumer element cannot take a ref (it is not a DOM element), STOP and
  report.

## Verification

- **Mechanical**:
  - `npm run lint`, `npm run build`, `npm test` — clean, 77 pass.
  - `grep -n "setProperty('--x'\|setProperty('--y'" src/components/Waves.jsx` —
    expect **no output**.
  - `grep -n "var(--x)\|var(--y)" src/components/Waves.jsx` — expect no output.
- **Feel check**: run `npm run dev`, scroll to the Contact section, then:
  - Move the pointer across the wave field. The follower element must track the
    pointer exactly as before — same position, same smoothing. If it is offset
    by half its own size, the `translate(-50%, -50%)` suffix is missing or
    ordered wrong.
  - Move the pointer to each corner of the field and confirm the follower stays
    centred on the pointer, not lagging into a corner.
  - Touch: in mobile emulation, drag across the field and confirm the same.
  - In DevTools → Performance, record 3 seconds of pointer movement over the
    field. Compare "Recalculate Style" entries against a `git stash` baseline —
    the count should drop, because style no longer invalidates for the whole
    subtree on every frame.
  - With reduced motion emulated, confirm the field is drawn but static and the
    follower does not move — the listeners should not be bound at all.
- **Done when**: no `--x`/`--y` remains, the follower tracks the pointer
  identically, and recalculate-style work during pointer movement is measurably
  lower.
