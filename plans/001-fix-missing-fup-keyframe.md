# 001 — Fix the missing `fup` keyframe that hides the AI Lab hero

- **Status**: TODO
- **Commit**: 30da02f
- **Severity**: HIGH
- **Category**: Not an animation-polish item — a rendering bug caused by animation code
- **Estimated scope**: 1 file, ~8 lines

## Problem

`.anomaly-inner` sets `opacity: 0` in its base rule and relies on a CSS animation
named `fup` to fade it back in. **`@keyframes fup` does not exist anywhere in the
repository.**

Verified: `grep -rn "fup" src/` returns exactly one hit — the `animation`
declaration itself. The full list of keyframes that DO exist is: `blinkc`,
`btn-shimmer`, `eyebrow-glitch`, `ffblink`, `fftyping`, `journeyFloat`,
`pcfFade`, `pfloat`, `plblink`, `revampPulseRing`, `sectionLoading`, `termline`,
`tick`, `tick-rev`. No `fup`.

When `animation-name` resolves to a keyframe set that does not exist, no
animation runs, so `forwards` has nothing to fill from and the base
`opacity: 0` is never overridden. The element stays invisible permanently.

```css
/* src/components/AnomalousHero.css:43-50 — current */
.anomaly-inner {
  max-width: 800px;
  padding: 0 1rem;
  opacity: 0;
  animation: fup 1.5s ease forwards 0.5s;
  pointer-events: auto; /* allow clicks on backlink */
}
```

What is inside that element (`src/components/AnomalousHero.jsx:187-191`):

```jsx
<div className="anomaly-inner">
  <div className="s-eyebrow" style={{ color: 'rgba(255, 255, 255, 0.52)' }}>{title}</div>
  <h1 className="s-title" style={{ marginBottom: '16px' }}>{subtitle}</h1>
  <p className="ai-lab-intro" style={{ margin: '0' }}>{description}</p>
</div>
```

So the eyebrow, the `<h1>` and the description of this hero never appear. The
component renders on the AI Lab route (`src/App.jsx:405`, inside the
`aiLabPage` branch), so that page currently ships a hero with an invisible
heading.

## Target

Define the missing keyframe, and bring the timing inside the playbook's budget
for an entrance. Entrances use `ease-out`; the repo's ease-out token is
`--ease-standard: cubic-bezier(.16,1,.3,1)` (declared in `src/index.css:27`,
which is loaded globally, so the variable is available in this file).

A pure-fade entrance is also a physicality finding on its own — nothing in the
real world appears from nothing — so the keyframe adds a small upward
translate. Per the playbook, entrance transforms stay in the `0.9–0.97` scale
band; for a translate, a short offset is the equivalent.

```css
/* src/components/AnomalousHero.css — target */
@keyframes fup {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anomaly-inner {
  max-width: 800px;
  padding: 0 1rem;
  opacity: 0;
  animation: fup 0.5s var(--ease-standard) forwards 0.15s;
  pointer-events: auto; /* allow clicks on backlink */
}

@media (prefers-reduced-motion: reduce) {
  .anomaly-inner {
    animation: none;
    opacity: 1;
  }
}
```

Exact values, do not substitute:
- keyframe name: `fup` (keep it — the declaration already references it)
- duration: `0.5s`
- easing: `var(--ease-standard)`
- delay: `0.15s`
- translate distance: `16px`

The reduced-motion block is mandatory here, not optional: because the base rule
is `opacity: 0`, anything that stops the animation from running re-creates the
exact bug this plan fixes. Setting `opacity: 1` there makes the content
unconditionally visible.

## Repo conventions to follow

- Motion tokens live in `src/index.css:27-30`:
  `--ease-standard: cubic-bezier(.16,1,.3,1);`, `--tr-fast: .2s;`,
  `--tr-base: .28s;`, `--tr-slow: .55s;`. Use `var(--ease-standard)`; do not
  retype the cubic-bezier inline.
- `src/components/AnomalousHero.css` is a per-component stylesheet imported at
  `src/components/AnomalousHero.jsx:4` (`import "./AnomalousHero.css";`). Put
  the keyframe in this file, next to the rule that uses it — not in
  `src/index.css`.
- Exemplar of a correct reduced-motion CSS block in this repo:
  `src/index.css:1721-1725`
  ```css
  @media (prefers-reduced-motion: reduce) {
    .pcf-mask > * { transform:none !important; transition:none !important; }
    .pcf-tile { transition:none; }
    .pcf-caption { animation:none; }
  }
  ```

## Steps

1. Open `src/components/AnomalousHero.css`. Immediately **above** the
   `.anomaly-inner` rule (currently at line 43), insert the `@keyframes fup`
   block exactly as written in the Target section.
2. In the existing `.anomaly-inner` rule, replace the line
   `animation: fup 1.5s ease forwards 0.5s;` with
   `animation: fup 0.5s var(--ease-standard) forwards 0.15s;`. Leave
   `opacity: 0`, `max-width`, `padding` and `pointer-events` untouched.
3. At the **end** of `src/components/AnomalousHero.css`, append the
   `@media (prefers-reduced-motion: reduce)` block from the Target section.

## Boundaries

- Do NOT touch `src/components/AnomalousHero.jsx` — the markup is correct.
- Do NOT touch `src/index.css`.
- Do NOT rename the keyframe. Other work may reference `fup` later; the
  declaration already names it.
- Do NOT remove `opacity: 0` from the base rule as a shortcut "fix". It is what
  makes the entrance possible; the reduced-motion block is the safety net.
- Do NOT add dependencies.
- If `.anomaly-inner` no longer contains `animation: fup …` (drift since commit
  30da02f), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npm run lint` — expect zero errors.
  - `npm run build` — expect `✓ built`.
  - `grep -n "@keyframes fup" src/components/AnomalousHero.css` — expect exactly
    one match.
- **Feel check**: run `npm run dev`, navigate to the AI Lab route (the route that
  renders `AnomalousMatterHero`; see the `aiLabPage` branch at
  `src/App.jsx:405`), then confirm:
  - The eyebrow, the `<h1>` and the description are **visible**. Before this
    fix they are not — this is the primary check.
  - They fade in while rising slightly, and finish well under a second.
  - In DevTools → Animations panel, set playback speed to 10% and confirm the
    text starts at a 16px downward offset and settles to 0 without overshoot.
  - In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce",
    reload the page and confirm the text is **immediately visible** with no
    movement. If it is invisible under reduced motion, the reduced-motion block
    is missing or misplaced.
- **Done when**: the AI Lab hero heading is visible in both the default and the
  reduced-motion state, and `npm run build` passes.
