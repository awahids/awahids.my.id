# 006 — Raise the two entrance scale floors above 0.9

- **Status**: DONE
- **Commit**: b132b95
- **Severity**: HIGH (badge) / MEDIUM (cards)
- **Category**: Physicality & origin (§3)
- **Estimated scope**: 2 files, 4 lines

## Problem

The playbook: **never `scale(0)`** — nothing in the real world appears from
nothing — and entrance transforms belong in the `0.9–0.97` band.

Two sites break that floor.

```jsx
/* src/components/FloatingFAQ.jsx:651-656 — current. Unread-count badge. */
<motion.div
  className="ff-unread-badge"
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0, opacity: 0 }}
>
```
`scale: 0` on both entrance and exit — the badge pops out of and back into
literal nothing.

```js
/* src/lib/sectionMotion.js:110-118 — current. cardPop, used by project,
   build and certificate cards. */
const cardPopByDevice = (reduceMotion) => {
  if (reduceMotion) return noMotionVariant;
  return {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.82,
    },
```
`0.82` combined with `y: 60` reads as a pop-from-nothing rather than a settle.

## Target

```jsx
/* target — src/components/FloatingFAQ.jsx */
initial={{ scale: 0.9, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
exit={{ scale: 0.9, opacity: 0 }}
```

```js
/* target — src/lib/sectionMotion.js */
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.95,
    },
```

Exact values, do not substitute: `0.9` for the badge (entrance and exit),
`0.95` for `cardPop`. Leave `y: 60` alone — it is a scroll-reveal distance on
a marketing page, not an entrance scale, and it is out of scope.

## Repo conventions to follow

- `src/lib/sectionMotion.js` centralises Framer variants and already branches on
  `reduceMotion` at line 111 (`if (reduceMotion) return noMotionVariant;`).
  Do not add a second reduced-motion branch — that one already covers it.
- Exemplar of an entrance already inside the band, for reference:
  `src/components/FloatingFAQ.jsx:580-582` uses `scale: 0.95` on message
  entrances.

## Steps

1. `src/components/FloatingFAQ.jsx`, the `.ff-unread-badge` `motion.div` at
   ~line 651: change `scale: 0` to `scale: 0.9` in both the `initial` and the
   `exit` object. Leave `animate` at `scale: 1`.
2. `src/lib/sectionMotion.js`, inside `cardPopByDevice`'s `hidden` object at
   ~line 116: change `scale: 0.82,` to `scale: 0.95,`.

## Boundaries

- Do NOT touch `opacity` values anywhere.
- Do NOT change `y: 60` in `cardPop`.
- Do NOT change the `cardPop` spring config (`stiffness: 42, damping: 12`).
- Do NOT touch any other variant in `src/lib/sectionMotion.js`.
- Do NOT touch `src/index.css`.
- Do NOT add dependencies.
- If either value is already within `0.9–0.97` (drift), SKIP and note it.

## Verification

- **Mechanical**:
  - `npm run lint` — zero errors.
  - `npm run build` — `✓ built`.
  - `npm test` — 77 pass, 0 fail.
  - `grep -n "scale: 0," src/components/FloatingFAQ.jsx` — expect **no output**.
  - `grep -n "scale: 0.82" src/lib/sectionMotion.js` — expect **no output**.
- **Feel check**: run `npm run dev`, then:
  - Open the FAQ chat widget, close it, and wait for the assistant to produce an
    unread message so the badge mounts. Confirm the badge grows in from
    *slightly* smaller rather than from a point, and shrinks back the same way
    on dismiss. In DevTools → Animations at 10% playback, the badge should never
    be smaller than roughly nine-tenths of its final size.
  - Scroll to the projects, "what I build" and certificates sections and confirm
    the cards settle rather than pop. The change is subtle by design; the tell is
    that the card no longer looks like it is rushing toward the viewer.
  - In DevTools → Rendering → reduced motion, confirm the cards appear with no
    scale or travel at all — `noMotionVariant` should still short-circuit.
- **Done when**: neither grep returns a match, and the badge's minimum size in
  slow motion is visibly close to its final size.
