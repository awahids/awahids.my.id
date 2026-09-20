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

## Recommended execution order

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
