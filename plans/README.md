# Animation plans

Produced by the `improve-animations` audit against commit `30da02f`.
Each plan is self-contained: exact file paths, verbatim current code, exact
target values, and a feel check. An executor needs no context beyond the plan
file.

Source of the target values: Emil Kowalski's animation philosophy, as encoded
in the audit playbook.

## Plans

| # | Title | Severity | Category | Files | Status |
| --- | --- | --- | --- | --- | --- |
| [001](001-fix-missing-fup-keyframe.md) | Fix the missing `fup` keyframe that hides the AI Lab hero | HIGH | Rendering bug | 1 | DONE `cf66317` |
| [002](002-gate-hover-motion-behind-fine-pointer.md) | Gate hover-only motion behind a fine-pointer media query | HIGH | Accessibility | 1 | DONE `f26dac7` |
| [003](003-add-press-feedback.md) | Add press feedback to pressable elements | HIGH | Physicality | 1 | DONE `2960e53` |
| [004](004-reduced-motion-for-js-driven-motion.md) | Add reduced-motion handling to the five JS-driven motion files | HIGH | Accessibility | 5 | DONE `7bb977f` |
| [005](005-replace-transition-all.md) | Replace the two `transition: all` declarations | HIGH | Performance | 1 | DONE `98f82c1` |

## Status

All five plans are implemented and committed on branch `rebranding`, executed in
the order below. `npm test` 77/77, `npm run lint` clean, `npm run build` passes
at every commit.

### Verified in a browser

- **001** — the AI Lab hero is visible. Computed `animation-name` now resolves
  to `fup`, computed `opacity` is `1`, transform settled to `translateY(0)`. The
  eyebrow, `<h1>` and description all render. All three were invisible before.
- **002** — on a fine pointer the gate evaluates true and `.nav-cta` still lifts
  (`matrix(1, 0, 0, 1, 0, -1)`). Under mobile emulation the gate evaluates false
  and the same element reports `transform: none`. Crucially,
  `.cert-card-view` reports `opacity: 1` / `transform: none` on touch, so the
  "view" affordance survives — the failure mode this plan was written to avoid.
  14 gated media blocks live in the CSSOM.
- **003** — the press rule is present in the CSSOM with all seven selectors and
  `transform: scale(0.97)`. `.btn-prime` computes
  `transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)`.
- **004, CSS half** — removing `body.has-custom-cursor` at runtime flips all six
  testable elements from `cursor: none` to `cursor: pointer`, confirming the
  reset that keeps a pointer visible for reduced-motion users.

No console errors on either viewport.

### NOT verified, and needs a human

**Plan 004's reduced-motion branches.** Toggling `prefers-reduced-motion` is not
available through the tooling used here, so the actual reduced-motion behaviour
of the five JS files was never exercised. What was confirmed is textual: the
Preloader's `onComplete` sits outside every ternary and therefore fires in both
branches. That is the specific thing that, if wrong, makes the site never appear
for reduced-motion users only.

Please run the full pass once with DevTools → Rendering →
"Emulate CSS prefers-reduced-motion: reduce" and confirm: the preloader fades
and the site appears, a native cursor is visible, the Contact line field is
drawn but static, the skills particles are present but do not drift, and the
mobile tab bar fades in without rising.


## Measured: the px→rem spacing conversion is not needed

After `14efe8a` converted every font-size to rem, the obvious follow-up was to
convert the 321 px `padding`/`margin`/`gap` declarations too, so the layout would
grow with the text (§15, "scale layout with the text"). That work was measured
before it was written, and the measurement says **do not do it**.

Method: render the site, snapshot every text-bearing element's clipped overflow
at a 16px root, then again at larger roots, and report only elements that clip
*more* than they already did.

| Viewport | Root | Page horizontal overflow | Newly clipped text |
| --- | --- | --- | --- |
| desktop | 20px | 0 | 2 of 457 |
| desktop | 24px | 0 | 3 of 457 |
| desktop | 28px | 0 | 3 of 457 |
| 375px | 20px | 0 | 5 of 497 |
| 375px | 24px | 0 | 7 of 497 |

The page never overflows horizontally, even at 175% text. And every flagged
element turned out to be intentional rather than broken:

- `.s-title`, `.journey-title`, `.contact-headline` — large headings whose
  `overflow: hidden` trims a few pixels of descender. Already true at 16px.
- `.journey-item-title` — declares
  `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` and already
  steps its size down at three breakpoints. Larger text truncates sooner and
  shows the ellipsis, which is exactly what that declaration is for.

The layout absorbs the growth because `clamp()` caps the display sizes, the grid
and flex containers size automatically, and the padding is generous. Converting
321 declarations would have risked a pixel-tuned design to fix damage that does
not exist.

Also measured and rejected, in the same pass: tokenizing `letter-spacing` and
`line-height`. The full distribution is 32 tracking and 34 leading values, and
the direction is already correct per §15 — negative tracking on display type,
positive on small uppercase labels. Collapsing them into a 6-token scale is not
possible without visible drift, and naming six near-identical positive values
`--track-label-s/m/l/xl/2xl` is aliasing, not a system: it gives none of the
three things a token earns its place with. The outliers that looked like drift
turned out to be signature elements — `.24em` is `.s-eyebrow`, which appears
once in CSS and on every section of the site.

## Batch 2 — findings 6-20

Nine plans covering the fifteen remaining vetted findings, grouped by file and
fix pattern. Written against commit `b132b95`.

| # | Title | Severity | Category | Files | Status |
| --- | --- | --- | --- | --- | --- |
| [006](006-raise-entrance-scale-floors.md) | Raise the two entrance scale floors above 0.9 | HIGH | Physicality | 2 | DONE `03fa084` |
| [007](007-remove-ease-in-from-exits.md) | Remove `ease-in` from every exit animation | MEDIUM | Easing | 2 | DONE `3d33f9c` |
| [008](008-fix-triplicate-build-card-num.md) | Delete the duplicate `.build-card-num` overriding the GSAP opt-out | MEDIUM | Correctness | 1 | DONE `aba7b6d` |
| [009](009-stop-animating-layout-properties.md) | Stop animating layout properties in CSS | HIGH | Performance | 2 | DONE `f62ebec` |
| [010](010-reduced-motion-keep-feedback.md) | Keep feedback under reduced motion, gate the two loose loops | MEDIUM | Accessibility | 1 | DONE `d0fa953` |
| [011](011-waves-direct-transform.md) | Write the Waves cursor transform directly | MEDIUM | Performance | 1 | DONE `31b09df` |
| [012](012-fix-wrong-keyframe-primitives.md) | Replace two keyframes with the right primitive | LOW | Interruptibility | 2 | DONE `59c674e` |
| [013](013-consolidate-curves-and-durations.md) | Consolidate duplicate curves and over-budget durations | MEDIUM | Cohesion | 2 | DONE `70f7ede` |
| [014](014-coverflow-keyboard-and-velocity.md) | Make the coverflow keyboard instant and its swipe velocity-aware | MEDIUM | Purpose / Interruptibility | 1 | DONE `961629a` |

### Execution order for batch 2

Five of the nine touch `src/index.css`, so those must run sequentially. The rest
are independent.

**Parallel first:** 007, 011, 014 — no shared files with anything.
**Then the `index.css` chain:** 008 → 010 → 013 → 012.
**Then:** 006, which must precede 012 (both touch `FloatingFAQ.jsx`).
**Last, alone:** 009.

009 goes last and by itself because it is the only plan that rewrites how
`CustomCursor.jsx` composes its transform. The cursor is written every frame by
`setPos`; an inline transform replaces the stylesheet's, so the scale has to be
threaded through a custom property that the JS transform string includes. The
plan carries an explicit instruction to stop and revert rather than half-apply
it. If the cursor stops tracking the pointer, that is the cause.

### Two corrections to the audit, found while writing these

- `.build-card-num` is declared **three** times, not twice. The audit reported
  two.
- `btn-shimmer` is already gated for reduced motion at `src/index.css:2976-2977`.
  The audit listed it as ungated. The genuinely ungated movement loops are
  `journeyFloat` and `sectionLoading`.
- Finding 8 claimed "54 bare `ease` against 24 `var(--ease-standard)`" was a
  cohesion problem. It mostly is not: the playbook assigns bare `ease` to hover
  and colour changes, which is what most of those 54 are. Plan 013 therefore
  scopes the bare-`ease` sweep out entirely and handles only the duplicate
  curves, the dead `--tr-slow` token, and the six over-budget durations.

Also now dead: `#cursor, #cursor-ring { transition: none; }` in the
reduced-motion block, since commit `7bb977f` stops the cursor from rendering at
all in that state. Plan 010 removes it.

## Recommended execution order (batch 1)

**001 → 005 → 002 → 003 → 004**

Reasoning:

1. **001 first, on its own.** It is not an animation-polish item — a keyframe is
   referenced that does not exist, so the AI Lab hero's heading is invisible in
   production right now. Smallest diff, largest user-visible effect. Ship it
   before anything else.
2. **005 next** because it is two lines and it removes `transition: all` from
   `.cert-card-view`, which plan 002 then rewrites. Doing 005 first means 002
   edits a rule that is already in its final shape.
3. **002 before 003.** Plan 002 removes decorative hover transforms on touch;
   plan 003 adds press transforms. Running them in this order means the feel
   check for 003 ("does anything both shrink and lift at once?") is testing
   against already-corrected hover behaviour rather than a moving target.
4. **004 last** because it is the only plan touching `.jsx` and `.js` files, is
   the largest diff, and carries the one genuinely risky regression in the set
   (see below). Isolating it makes a bisect trivial if the site fails to load.

## Dependencies and overlaps

- **002 ↔ 005** overlap on `.cert-card-view` (`src/index.css:2024`). Plan 002's
  target block already contains plan 005's named-properties transition, and both
  plans say so and instruct the executor to check the rule's current state and
  skip if already done. Either order is safe; 005-then-002 produces the cleaner
  diff.
- **003 → 005** is a deliberate hand-off. Plan 003 leaves
  `.ff-suggestion-btn`'s `transition: all` untouched and defers its `transform`
  leg to plan 005, which specifies `transform 160ms var(--ease-standard)` — the
  same press duration plan 003 uses everywhere else. Do not "helpfully" add a
  transform leg to that rule while executing 003.
- **003 vs existing Framer `whileTap`** — five elements already have
  `whileTap` (`src/components/Hero.jsx:180,191`,
  `src/components/Contact.jsx:97,108`). Plan 003 instructs the executor to skip
  any selector that lands on those, to avoid compounding two transforms.
- No other plan pair touches the same lines.

## Highest-risk step in the set

Plan 004, step 2 (`src/components/Preloader.jsx`). The preloader's `onComplete`
callback is what unmounts it and reveals the site. If the reduced-motion branch
drops that callback, the site never appears **for reduced-motion users only** —
which will not show up in a normal local check. Plan 004's feel check requires
running the whole pass twice, once with
DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce" enabled.
Do not skip the second pass.

## Out of scope

The audit produced 20 vetted findings; these five are the ones selected. Not
planned, in rough leverage order:

- Coverflow gesture work: drag dismissal is distance-only with no velocity term
  (`src/components/ProjectCoverflow.jsx:118`), tiles do not follow the finger,
  boundaries hard-stop with no rubber-band, and the resolution is a fixed 0.7s
  CSS tween rather than a spring (`src/index.css:1620`). Highest craft payoff
  left, and the most expensive — worth its own batch.
- Easing token under-adoption: 54 bare `ease` against 24 `var(--ease-standard)`,
  `--tr-slow` with zero usages, and three near-duplicate ease-out curves.
- `ease-in` on three modal exits (`src/lib/modalMotion.js:14,46,60`) plus two
  GSAP `power2.in` tweens (`src/components/PortfolioScrollSwap.jsx:93-94`).
- A duplicate `.build-card-num` selector (`src/index.css:4044`) that overrides an
  explicit `transition: none /* Let GSAP drive */` opt-out at
  `src/index.css:3919`, so `color` is now driven by CSS and GSAP simultaneously.
- Arrow keys triggering an animated smooth-scroll in the coverflow
  (`src/components/ProjectCoverflow.jsx:92`) — the playbook says keyboard
  actions should not animate.
- Six interactive elements over the 300ms budget; six reduced-motion blocks that
  use bare `transition: none` and so kill colour feedback along with movement;
  three ungated infinite loops (`journeyFloat`, `btn-shimmer`, `sectionLoading`);
  `cardPop` entering from `scale: 0.82` (`src/lib/sectionMotion.js:113`); parent
  CSS variables driving child transforms in `Waves.jsx` and `GlyphPortal.jsx`;
  `width`/`max-width` transitions on the pagination dots and coverflow tab arrow.

Four missed opportunities were also identified and not planned: the CV-download
success state teleports (`src/components/CvDownloadModal.jsx:138`), the
certificates "View More" instantly materialises N cards with `initial={false}`
explicitly disabling the available entrance (`src/components/Certificates.jsx:141`),
the FAQ panel declares `transformOrigin: 'bottom right'` but animates no scale so
the origin is inert (`src/components/FloatingFAQ.jsx:541`), and the mobile tab bar
has no shared active indicator so selection teleports (`src/index.css:2990`).
