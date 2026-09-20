# 004 — Add reduced-motion handling to the five JS-driven motion files

- **Status**: TODO
- **Commit**: 30da02f
- **Severity**: HIGH
- **Category**: Accessibility (§6) — movement with no `prefers-reduced-motion` handling
- **Estimated scope**: 5 files, ~10 lines each

## Problem

CSS `@media (prefers-reduced-motion: reduce)` blocks cannot reach motion that
JavaScript writes frame by frame. Five files in this repo animate from JS with
**zero** reduced-motion handling. Measured with
`grep -c 'prefers-reduced-motion\|useReducedMotion\|reduceMotion'`:

| File | Matches | What it animates |
| --- | --- | --- |
| `src/components/Waves.jsx` | **0** | Continuous rAF loop mutating SVG path `d` attributes; noise-driven point drift plus mouse/touch distortion |
| `src/components/Preloader.jsx` | **0** | 1s full-viewport `y: '-100%'` GSAP slide on first paint |
| `src/components/CustomCursor.jsx` | **0** | rAF loop writing cursor transforms every frame; magnetically displaces buttons under the pointer |
| `src/lib/skillsScene.js` | **0** | three.js render loop: particle drift, `points.rotation.z` accumulation, lerped camera parallax |
| `src/components/MobileNav.jsx` | **0** | Framer Motion spring entrance, `y: 100 → 0` |

For contrast, two files already do this correctly:

| File | Matches |
| --- | --- |
| `src/lib/useLenis.js` | 1 |
| `src/components/GlyphPortal.jsx` | 3 |

So the convention exists in this codebase; it simply has not been applied to
these five. `Waves` is mounted unconditionally at
`src/components/Contact.jsx:68`, and Contact is a normal scroll-to section, so
every visitor gets the continuous animation. The Preloader slide is the single
largest movement on the site and is unskippable.

The existing CSS reduced-motion rule for the cursor is insufficient and
demonstrates the problem exactly:

```css
/* src/index.css:4229 — does nothing to a rAF-driven transform */
#cursor, #cursor-ring { transition: none; }
```

## Target

Every file reads the media query and branches. Reduced motion means **fewer and
gentler**, not zero — so the target is to remove continuous and large-distance
movement while keeping the element present and functional.

### The canonical read (copy this expression verbatim)

```js
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Per-file target

**`src/components/Waves.jsx`** — render one static frame, then stop. Do not
start the loop, and do not bind the pointer-reactive listeners.

```js
/* target, replacing the rAF start at src/components/Waves.jsx:47 */
if (prefersReducedMotion) {
  movePoints(0);
  drawLines();
} else {
  window.addEventListener('mousemove', onMouseMove);
  containerElt.addEventListener('touchmove', onTouchMove, { passive: false });
  rafRef.current = requestAnimationFrame(tick);
}
```
The `resize` listener stays bound in both branches — it is not motion. Under
reduced motion, the resize handler should re-run `movePoints(0); drawLines();`
rather than restarting the loop.

**`src/components/Preloader.jsx`** — keep the exit, drop the travel.

```js
/* target, replacing the gsap.to at src/components/Preloader.jsx:15-20 */
gsap.to('.preloader', {
  autoAlpha: prefersReducedMotion ? 0 : 1,
  y: prefersReducedMotion ? '0%' : '-100%',
  duration: prefersReducedMotion ? 0.2 : 1,
  ease: prefersReducedMotion ? 'none' : 'expo.inOut',
  onComplete: onComplete
});
```
Exact values: `0.2` seconds and `'none'` easing under reduced motion; `1` second
and `'expo.inOut'` otherwise. `onComplete` must fire in both branches or the app
never un-mounts the preloader.

**`src/components/CustomCursor.jsx`** — the custom cursor is itself a
constantly-moving element and it physically displaces buttons. Under reduced
motion, restore the native cursor and do not run the loop, reusing the existing
early-return path.

```js
/* target, extending the guard at src/components/CustomCursor.jsx:18-24 */
const hasFinePointer = window.matchMedia(
  '(hover: hover) and (pointer: fine)'
).matches;
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!hasFinePointer || prefersReducedMotion) {
  dot.style.display = 'none';
  ring.style.display = 'none';
  document.documentElement.style.cursor = '';
  return undefined;
}
```
The `document.documentElement.style.cursor = ''` line is required: the
stylesheet sets `cursor: none` on interactive elements, so hiding the custom
cursor without restoring the native one would leave the user with no pointer at
all. If that assignment does not resolve the missing pointer in the feel check,
add a `data-reduced-cursor` attribute on `<html>` in this branch and a matching
`@media (prefers-reduced-motion: reduce)` block in `src/index.css` that resets
`cursor: auto` on the affected selectors — and note that you did so.

**`src/lib/skillsScene.js`** — render one frame, do not loop.

```js
/* target, replacing the tick() call at src/lib/skillsScene.js:~118 */
if (prefersReducedMotion) {
  renderer.render(scene, camera);
} else {
  tick();
}
```
`alive` and the `rafId` cleanup stay as they are; cancelling an unassigned
`rafId` is already safe in the existing teardown.

**`src/components/MobileNav.jsx`** — keep the fade, drop the 100px travel. This
file already imports `motion` from `framer-motion`; add the hook to the same
import.

```jsx
/* target */
import { motion, useReducedMotion } from 'framer-motion';
// inside the component:
const reduced = useReducedMotion();
// on the motion.div at src/components/MobileNav.jsx:50-54:
<motion.div
  className="mobile-tab-bar"
  initial={{ y: reduced ? 0 : 100, x: '-50%', opacity: reduced ? 0 : 1 }}
  animate={{ y: 0, x: '-50%', opacity: 1 }}
  transition={
    reduced
      ? { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
      : { type: 'spring', damping: 20, stiffness: 100 }
  }
  role="navigation"
  aria-label="Mobile section navigation"
>
```
`x: '-50%'` is layout centring, not motion — it must stay identical in both
branches or the bar will sit off-centre.

## Repo conventions to follow

- **Exemplar for the plain-JS pattern** — `src/lib/useLenis.js:12-19`, which
  reads the query once and branches each value:
  ```js
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lenis = new Lenis({
    lerp: prefersReducedMotion ? 1 : 0.1,
    duration: prefersReducedMotion ? 0 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !prefersReducedMotion,
  });
  ```
- **Exemplar for the React/Framer pattern** — `src/components/Hero.jsx:2,70`:
  ```jsx
  import { motion, useReducedMotion } from 'framer-motion';
  const reduced = useReducedMotion();
  ```
  Other components already following it: `src/components/Contact.jsx:50`,
  `src/components/CvDownloadModal.jsx:20`,
  `src/components/SkillsRelay.jsx:50`,
  `src/components/ProjectCoverflow.jsx:25`.
- `src/components/GlyphPortal.jsx:89` uses
  `window.matchMedia("(prefers-reduced-motion: reduce)")` and keeps the
  `MediaQueryList` object. Either style is acceptable; prefer `.matches` read
  once, as in `useLenis.js`, since none of these five files need to react to the
  setting changing mid-session.
- The easing array `[0.16, 1, 0.3, 1]` is the JS form of the repo's
  `--ease-standard` token (`src/index.css:27`) and is already used at
  `src/lib/modalMotion.js:9`. Use it for the MobileNav reduced-motion tween.

## Steps

1. `src/components/Waves.jsx` — inside the same `useEffect` that currently
   starts the loop, add the canonical `prefersReducedMotion` read near the top.
   Replace the listener binding and `requestAnimationFrame(tick)` call at
   line ~47 with the branch from the Target section. Update the `onResize`
   handler so that under reduced motion it calls `movePoints(0); drawLines();`
   instead of relying on the loop. Leave the cleanup function's
   `cancelAnimationFrame` and `removeEventListener` calls in place — removing a
   listener that was never added is a no-op.
2. `src/components/Preloader.jsx` — add the canonical read inside the existing
   `useEffect`, then replace the `gsap.to('.preloader', { … })` call at
   lines 15-20 with the branched version from the Target section.
3. `src/components/CustomCursor.jsx` — add the canonical read next to the
   existing `hasFinePointer` read at line 18, and extend the early-return
   condition and body exactly as shown in the Target section.
4. `src/lib/skillsScene.js` — add the canonical read near the top of the
   exported setup function, then replace the bare `tick();` call (~line 118)
   with the branch from the Target section.
5. `src/components/MobileNav.jsx` — change the `framer-motion` import to
   `import { motion, useReducedMotion } from 'framer-motion';`, add
   `const reduced = useReducedMotion();` inside the component body before the
   `return`, and replace the `motion.div` props at lines 50-54 with the version
   from the Target section.

## Boundaries

- Do NOT remove any animation outright for non-reduced-motion users. Every
  change is a branch; the default path must behave exactly as it does today.
- Do NOT touch `src/lib/useLenis.js` or `src/components/GlyphPortal.jsx` — they
  already handle this correctly and are the exemplars.
- Do NOT add or change any `@media (prefers-reduced-motion: reduce)` block in
  `src/index.css`, with the single exception of the documented fallback in the
  CustomCursor step — and only if the feel check proves it necessary.
- Do NOT change `x: '-50%'` on the MobileNav bar. It is layout, not motion.
- Do NOT change the spring config `{ damping: 20, stiffness: 100 }` on the
  non-reduced path. Its inconsistency with the other springs in the repo is a
  separate, un-selected finding — out of scope here.
- Do NOT drop the `onComplete` callback in the Preloader branch. The app depends
  on it to unmount.
- Do NOT add dependencies. `framer-motion` is already installed at ^10.16.4 and
  exports `useReducedMotion`.
- If a file's structure does not match the excerpt (drift since commit 30da02f),
  STOP and report that file rather than guessing; the other four can still
  proceed.

## Verification

- **Mechanical**:
  - `npm run lint` — expect zero errors.
  - `npm run build` — expect `✓ built`.
  - `npm test` — expect **77 pass, 0 fail** (the suite does not cover these
    files; this only confirms nothing regressed).
  - For each of the five files, expect at least one match:
    `grep -c 'prefers-reduced-motion\|useReducedMotion' src/components/Waves.jsx src/components/Preloader.jsx src/components/CustomCursor.jsx src/lib/skillsScene.js src/components/MobileNav.jsx`
- **Feel check**: run `npm run dev`. Do the whole pass **twice** — once normally,
  once with DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce"
  enabled, reloading the page after toggling it.
  - **Default (reduce OFF)** — confirm nothing changed: the preloader still
    slides up over about a second, the custom cursor still follows the pointer
    and still pulls at primary buttons, the Contact section's line field still
    ripples and reacts to the pointer, the skills particles still drift, and the
    mobile tab bar still springs up from below.
  - **Reduced (reduce ON)** — confirm:
    - The preloader **fades** out quickly and the site becomes usable. If the
      site never appears, `onComplete` was dropped — this is the highest-risk
      regression in this plan.
    - A **native mouse cursor is visible** and buttons no longer drift toward
      it. If the pointer is invisible anywhere, apply the documented
      `data-reduced-cursor` fallback.
    - The Contact line field is **drawn and static** — visible, not blank, and
      not reacting to the pointer. A blank area means `movePoints(0);
      drawLines();` was not called.
    - The skills scene shows particles but they **do not drift or rotate**. A
      black or empty canvas means the single `renderer.render` call is missing.
    - The mobile tab bar (use mobile emulation) **fades in without rising**.
  - In DevTools → Performance, record 3 seconds while idle with reduce ON and
    confirm there is **no continuous rAF activity** from Waves or the skills
    scene. Persistent frame-by-frame work means a loop is still running.
- **Done when**: all five files branch on the media query, the default
  experience is visually unchanged, the reduced-motion experience has no
  continuous or large-distance movement while every element remains visible and
  functional, and `npm run build` plus `npm test` pass.
