# 013 — Consolidate the duplicate curves and the over-budget interactive durations

- **Status**: DONE
- **Commit**: b132b95
- **Severity**: MEDIUM
- **Category**: Easing & duration (§2), Cohesion & tokens (§7)
- **Estimated scope**: 1 file, ~10 edits

## Problem

### A. Near-duplicate ease-out curves

`src/index.css:27` declares the repo's ease-out token:

```css
--ease-standard: cubic-bezier(.16,1,.3,1);
```

Two other curves coexist with it:

```css
/* src/index.css — the token's value retyped inline, bypassing the variable */
transition: transform 0.5s cubic-bezier(.16,1,.3,1);

/* a second, slightly different curve, several sites in CSS plus three in JS */
cubic-bezier(0.22,1,0.36,1)
```
```jsx
/* src/components/Hero.jsx:15, 25, 32 — the same third curve in JS */
visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
```

Three curves that all mean "strong ease-out" is the playbook's consolidation
finding.

### B. A dead duration token

```css
--tr-slow: .55s;   /* zero usages in the entire file */
```

### C. Six interactive elements over the 300ms budget

The playbook's budget: dropdowns and selects 150–250ms, modals and drawers
200–500ms, **UI animations stay under 300ms**. Marketing and first-paint reveals
may be longer and are exempt.

```css
/* src/index.css:190  — nav scrolled state */
  transition: background .4s, border-color .4s;
/* src/index.css:632  — .build-card::after hover sheen, a FREQUENT target */
  transition:opacity .38s, background-position .6s;
/* src/index.css:1641 — .pcf-tile, the swipe response */
  transition:transform .7s var(--ease-standard), opacity .6s ease, filter .6s ease;
/* src/index.css:1652 — border-color .4s ease */
/* src/index.css:1667 — .pcf-corner, opacity .4s ease */
/* src/index.css:1687 — .pcf-mask > *, transform .5s var(--ease-standard) */
```

`.reveal` at ~1089 (`.7s`) is a scroll reveal on a marketing page and is
**exempt** — do not touch it.

## What this plan deliberately does NOT do

The audit initially flagged "54 bare `ease` against 24 `var(--ease-standard)`"
as a finding. **That was wrong and is not part of this plan.** The playbook
assigns easings by purpose:

> Hover / color change → `ease`

Most of those 54 are hover and colour transitions, where bare `ease` is the
*correct* choice. A blanket swap to `var(--ease-standard)` would make the
stylesheet worse, and classifying 54 sites by purpose is judgment work, not a
mechanical edit. Leave them alone.

## Target

### A. One curve

Replace every occurrence of `cubic-bezier(0.22,1,0.36,1)` in `src/index.css`
with `var(--ease-standard)`, and replace every inline
`cubic-bezier(.16,1,.3,1)` with `var(--ease-standard)`.

In `src/components/Hero.jsx`, replace every `[0.22, 1, 0.36, 1]` with
`[0.16, 1, 0.3, 1]` — the JS form of the same token, already used at
`src/lib/modalMotion.js:9`.

The two curves are visually near-identical; collapsing to one is the point.

### B. Delete the dead token

Remove the `--tr-slow: .55s;` declaration from `:root`. Do not "find a use for
it" — an unused token is noise, and the 0.55s value appears nowhere.

### C. Bring the six inside budget

```css
/* target — src/index.css:190 */
  transition: background var(--tr-base) var(--ease-standard),
              border-color var(--tr-base) var(--ease-standard);
/* target — src/index.css:632 */
  transition:opacity var(--tr-base) var(--ease-standard),
             background-position var(--tr-base) var(--ease-standard);
/* target — src/index.css:1641 */
  transition:transform var(--tr-base) var(--ease-standard),
             opacity var(--tr-base) ease,
             filter var(--tr-base) ease;
/* target — src/index.css:1652 */
  transition:border-color var(--tr-base) ease;
/* target — src/index.css:1667 */
  transition:opacity var(--tr-base) ease;
/* target — src/index.css:1687 */
  transition:transform var(--tr-base) var(--ease-standard);
```

`--tr-base` is `.28s`, inside the 300ms budget. Also find the rule that sets
`.pcf-tile.is-active .pcf-mask > * { transition-duration:.75s; }` (~1688) and
change it to `var(--tr-base)` as well, or delete the override if `.28s` is
already inherited.

## Repo conventions to follow

- Tokens at `src/index.css:27-30`. After this plan `:root` should carry
  `--ease-standard`, `--tr-fast`, `--tr-base` — three, not four.
- `[0.16, 1, 0.3, 1]` is the established JS form; see `src/lib/modalMotion.js:9`.

## Steps

1. Replace all `cubic-bezier(0.22,1,0.36,1)` in `src/index.css` with
   `var(--ease-standard)`.
2. Replace all inline `cubic-bezier(.16,1,.3,1)` in `src/index.css` with
   `var(--ease-standard)`. Do **not** touch the `:root` declaration on line 27,
   which must keep the literal value.
3. In `src/components/Hero.jsx`, replace all `[0.22, 1, 0.36, 1]` with
   `[0.16, 1, 0.3, 1]`.
4. Delete `--tr-slow: .55s;` from `:root`.
5. Apply the six duration targets in section C, plus the `.75s` override.

## Boundaries

- Do NOT touch any bare `ease` keyword. See "What this plan deliberately does
  not do".
- Do NOT touch `.reveal` at ~1089, the Preloader's `expo.inOut`, the Lenis
  scroll duration, or any first-paint hero timing. Marketing durations are
  exempt.
- Do NOT touch the `:root` value of `--ease-standard` itself.
- Do NOT change `ease-in-out` on the infinite ambient loops at ~1196 and ~1323 —
  correct for constant motion.
- Do NOT introduce new tokens.
- Do NOT add dependencies.
- If `--tr-slow` turns out to have a usage (drift), STOP and report rather than
  deleting it.

## Verification

- **Mechanical**:
  - `npm run lint`, `npm run build`, `npm test` — clean, 77 pass.
  - `grep -c "cubic-bezier" src/index.css` — expect **1** (only the `:root`
    declaration).
  - `grep -rn "0.22, 1, 0.36, 1" src/` — expect no output.
  - `grep -c "tr-slow" src/index.css` — expect **0**.
  - `grep -nE "transition:[^;]*\.([4-9])s" src/index.css` — the only remaining
    hits should be `.reveal` and other exempt marketing rules; list what remains
    in your report.
- **Feel check**: run `npm run dev`, then:
  - Scroll past the top so the nav switches to its scrolled state. It should
    settle noticeably sooner than before without feeling abrupt.
  - Hover a "what I build" card and watch the sheen. It previously took 600ms to
    sweep; it should now complete in about a quarter of a second.
  - Swipe the project coverflow on a mobile viewport. The tile transition was
    700ms; it should now respond promptly. **Watch for the tile arriving before
    the caption** — if the two now feel desynchronised, report it rather than
    guessing at a new value.
  - Compare the hero entrance before and after the Hero.jsx curve swap. The two
    curves are near-identical, so any visible difference means the wrong array
    was substituted.
  - In DevTools → Animations at 10% playback, confirm no interactive transition
    runs longer than roughly a third of a second.
- **Done when**: `cubic-bezier` appears once in the stylesheet, `--tr-slow` is
  gone, no interactive transition exceeds 300ms, and the coverflow still reads as
  one coordinated movement.
