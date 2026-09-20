# 010 — Keep feedback under reduced motion, and gate the two loose loops

- **Status**: DONE
- **Commit**: b132b95
- **Severity**: MEDIUM
- **Category**: Accessibility (§6)
- **Estimated scope**: 1 file, ~8 small edits

## Problem

The playbook: reduced motion means **fewer and gentler animations, not zero** —
keep transitions that aid comprehension, remove position changes.

### A. Six blocks that nuke all feedback

A bare `transition: none` strips the colour and opacity cues along with the
movement, leaving state changes with no perceptible feedback at all.

```css
/* src/index.css:1508-1510 — the worst one */
@media (prefers-reduced-motion: reduce) {
  .skills-relay-dot { transition: none; }
}
```
`.skills-relay-dot`'s only active-state cue is a `background` fade to
`var(--lime)`; killing its transition removes the one signal that tells a
reduced-motion user which dot is active.

The other five, same pattern:
```css
/* 1743  */ .pcf-tile { transition:none; }
/* 2981  */ .floating-top-btn { transition:none; }
/* 3756-7*/ .pswap-progress-fill { transition: none; }
            .pswap-dot { transition: none; }
/* 4030  */ .nav-underline { transition: none; }
/* 4032  */ .cc-copied-badge { transition: none; }
/* 4035  */ .cc-email-copy { transition: none; }
```

`.pcf-mask > *` at 1742 is **correct** and must stay — it uses
`transform:none !important; transition:none !important` to kill a
`translateY(110%)` reveal, which is exactly the position change that should go.

### B. Two ungated infinite movement loops

```css
/* src/index.css:1323 — a 340px glyph translating up and down forever */
.journey-glyph { ... animation:journeyFloat 5s ease-in-out infinite; }

/* src/index.css:1196 — a translateX loop on the section loading bar */
... animation:sectionLoading 1.1s ease-in-out infinite;
```

Neither appears in any reduced-motion block. Note that `btn-shimmer` **is**
already gated (`src/index.css:2976-2977` lists `.nav-cta` and `.btn-prime`), and
`blinkc`-family blinkers are opacity-only, so they may stay.

### C. One rule that is now dead

```css
/* src/index.css:4268 */
#cursor, #cursor-ring { transition: none; }
```
Commit `7bb977f` made `CustomCursor.jsx` return early under reduced motion, so
neither element is ever rendered in that state. This rule can no longer match.

## Target

### A. Name the properties instead of killing them

For each of the seven selectors, replace the bare `transition: none` with a
transition that keeps paint and drops movement. Where the element only ever
animates paint, simply **delete the override** — it should keep its normal
transition.

```css
/* target — src/index.css:1508-1510 */
@media (prefers-reduced-motion: reduce) {
  .skills-relay-dot { transition: background var(--tr-fast) var(--ease-standard); }
}
```

For each of the other six, read the element's normal `transition` declaration
first, then write a reduced version that keeps every **paint** leg
(`background`, `color`, `border-color`, `box-shadow`, `opacity`) and drops every
**movement** leg (`transform`, `width`, `height`, `translate`). If an element's
normal transition contains no movement leg at all, delete the reduced-motion
override for it entirely and say so in your report.

### B. Gate the two loops

Add to an existing reduced-motion block — use the one at ~4264, which already
collects late additions:

```css
/* target — add inside the @media (prefers-reduced-motion: reduce) block */
  .journey-glyph { animation: none; }
```
and for the loading bar, add its selector (read it from the rule containing
`animation:sectionLoading` at ~1196) with `animation: none;` in the same block.

Both are pure decoration with no state meaning, so `animation: none` is correct
here — unlike section A, there is no cue to preserve.

### C. Delete the dead rule

Remove `#cursor, #cursor-ring { transition: none; }` at ~4268.

## Repo conventions to follow

- Motion tokens at `src/index.css:27-30`.
- The correct shape to imitate, already in the file at `src/index.css:1741-1745`:
  a reduced-motion block that kills a `transform` reveal while leaving other
  properties alone.
- Reduced-motion blocks in this file are scattered rather than centralised
  (there are six). Keep each edit in the block it already lives in; do not
  consolidate.

## Steps

1. For each of the seven selectors in section A, find its **normal** transition
   declaration elsewhere in the file and record it in your report. Then rewrite
   or delete its reduced-motion override per target A.
2. Add `.journey-glyph { animation: none; }` to the reduced-motion block at
   ~4264.
3. Read the rule at ~1196 that carries `animation:sectionLoading`, take its
   selector, and add `<that-selector> { animation: none; }` to the same block.
4. Delete `#cursor, #cursor-ring { transition: none; }` at ~4268.

## Boundaries

- Do NOT touch `.pcf-mask > *` at ~1742 — it is correct.
- Do NOT gate `blinkc`, `ffblink` or `fftyping`. They animate opacity or
  content, not position, and the playbook says to keep comprehension cues.
- Do NOT gate `btn-shimmer` again — already handled at ~2976.
- Do NOT touch any `will-change: auto` declaration inside the reduced-motion
  blocks. Those are correct and unrelated.
- Do NOT add new reduced-motion `@media` blocks; use the existing ones.
- Do NOT touch any `.jsx` or `.js` file.
- Do NOT add dependencies.

## Verification

- **Mechanical**:
  - `npm run lint`, `npm run build` — clean.
  - `grep -cE "transition:\s*none" src/index.css` — expect a **decrease** from
    the current count; report the before and after numbers.
  - `grep -n "#cursor, #cursor-ring { transition: none; }" src/index.css` —
    expect no output.
  - `grep -c "journey-glyph" src/index.css` — expect **2** (the rule plus the
    new gate).
- **Feel check**: run `npm run dev` with DevTools → Rendering →
  "Emulate CSS prefers-reduced-motion: reduce" **enabled**, then:
  - Scroll to the skills relay and step through it. The active dot must still
    change colour — that is the whole point of this plan. If dots snap between
    colours with no transition, section A was not applied.
  - Hover the nav links and confirm the underline still responds.
  - Copy the email in the contact section and confirm the "copied" badge still
    fades in rather than appearing instantly.
  - Confirm the journey glyph is **static** — no floating.
  - Confirm no section loading bar is sliding.
  - Now disable the emulation and confirm every one of those still animates
    normally, including the glyph float.
- **Done when**: with reduced motion on, every state change still produces a
  visible paint cue while nothing translates or floats; with it off, nothing
  changed.
