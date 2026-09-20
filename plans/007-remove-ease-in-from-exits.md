# 007 — Remove `ease-in` from every exit animation

- **Status**: TODO
- **Commit**: b132b95
- **Severity**: MEDIUM
- **Category**: Easing & duration (§2)
- **Estimated scope**: 2 files, 5 lines

## Problem

The playbook is unambiguous: **entering or exiting → `ease-out`**, and
**`ease-in` on UI is always a finding** because it starts slow, delaying the
exact moment the user is watching. On an exit the user has already decided to
dismiss; making the first frames sluggish delays the thing they asked for.

There is no `ease-in` keyword anywhere in `src/index.css` — the CSS is clean.
It survives in JS, in two forms.

```js
/* src/lib/modalMotion.js — current. [0.4, 0, 1, 1] IS the literal CSS ease-in
   curve. Note lines 9 and 55 correctly use the repo's ease-out. */
 9:    transition: { duration: reduceMotion ? 0.12 : 0.24, ease: [0.16, 1, 0.3, 1] },   // overlay in  — correct
14:    transition: { duration: reduceMotion ? 0.12 : 0.18, ease: [0.4, 0, 1, 1] },      // overlay out — FINDING
46:        transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },                        // card out    — FINDING
55:    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },                         // child in    — correct
60:    transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },                            // child out   — FINDING
```

```js
/* src/components/PortfolioScrollSwap.jsx:93-94 — current. GSAP's power2.in is
   an ease-in, on a scroll-driven text swap-out. */
      ? { y: -20, opacity: 0, duration: 0.18, ease: 'power2.in', stagger: 0.02 }
      : { x: -36, opacity: 0, duration: 0.20, ease: 'power2.in', stagger: 0.025 };
```

## Target

Every exit uses the same ease-out the entrances already use.

```js
/* target — src/lib/modalMotion.js, all three exit transitions */
ease: [0.16, 1, 0.3, 1]
```

```js
/* target — src/components/PortfolioScrollSwap.jsx:93-94 */
      ? { y: -20, opacity: 0, duration: 0.18, ease: 'power2.out', stagger: 0.02 }
      : { x: -36, opacity: 0, duration: 0.20, ease: 'power2.out', stagger: 0.025 };
```

Exact values, do not substitute: the array `[0.16, 1, 0.3, 1]` (three sites)
and the string `'power2.out'` (two sites). Leave every `duration` and
`stagger` exactly as it is — only the easing changes.

`[0.16, 1, 0.3, 1]` is the JS form of `--ease-standard`
(`cubic-bezier(.16,1,.3,1)`, `src/index.css:27`).

## Repo conventions to follow

- `src/lib/modalMotion.js:9` and `:55` already use `[0.16, 1, 0.3, 1]` — they
  are the exemplar. This plan makes the exits match the entrances in the same
  file.
- GSAP easing elsewhere in the repo uses the `.out` family:
  `src/components/WhatIBuild.jsx:58` (`power2.out`),
  `src/components/Certificates.jsx:86` (`power3.out`).

## Steps

1. `src/lib/modalMotion.js` line ~14: change `ease: [0.4, 0, 1, 1]` to
   `ease: [0.16, 1, 0.3, 1]`. Leave `duration: reduceMotion ? 0.12 : 0.18`.
2. Same file, line ~46: same easing change. Leave `duration: 0.18`.
3. Same file, line ~60: same easing change. Leave `duration: 0.12`.
4. `src/components/PortfolioScrollSwap.jsx` line ~93: change `'power2.in'` to
   `'power2.out'`.
5. Same file, line ~94: same change.

## Boundaries

- Do NOT change any `duration`, `stagger`, `delay` or `reduceMotion` branch.
- Do NOT touch `src/lib/modalMotion.js:9` or `:55` — already correct.
- Do NOT touch `src/index.css`. There is no `ease-in` keyword there, and the two
  `ease-in-out` uses at ~1196 and ~1323 are on infinite ambient loops, where
  `ease-in-out` is correct. Do not "fix" those.
- Do NOT change GSAP eases anywhere other than the two lines named.
- Do NOT add dependencies.
- If a site already uses an ease-out (drift), SKIP and note it.

## Verification

- **Mechanical**:
  - `npm run lint` — zero errors.
  - `npm run build` — `✓ built`.
  - `npm test` — 77 pass, 0 fail.
  - `grep -n "0.4, 0, 1, 1" src/lib/modalMotion.js` — expect **no output**.
  - `grep -rn "power2.in'" src/components/` — expect **no output**.
  - `grep -c "0.16, 1, 0.3, 1" src/lib/modalMotion.js` — expect **5**.
- **Feel check**: run `npm run dev`, then:
  - Open the CV download modal (the "Download Resume" button) and close it.
    Watch the close, not the open. It should begin moving immediately and
    decelerate out; it should not creep for the first few frames.
  - In DevTools → Animations at 10% playback, close the modal again and confirm
    the overlay and card start fast. An exit that barely moves at first, then
    accelerates, means a site was missed.
  - Scroll through the portfolio swap section so the text swaps out. The
    outgoing text should leave briskly rather than easing into motion.
  - Reduced motion: the modal's 0.12s branches should still apply; confirm the
    close is near-instant and nothing regressed.
- **Done when**: both greps return nothing, the 0.16 count is 5, and no exit
  visibly hesitates at its start in slow motion.
