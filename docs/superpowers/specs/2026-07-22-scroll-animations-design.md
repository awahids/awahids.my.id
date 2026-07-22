# Scroll Animations — Design Spec

Date: 2026-07-22
Status: Approved (rev 2 — UX mitigations)

## Revision 2 — UX mitigations (2026-07-22)

Rev 1 covered motion mechanics but under-addressed several UX costs. This revision
fixes them. Corrections to the original reasoning are called out explicitly where
rev 1 got the direction wrong.

1. **Skills relay loses skimmability.** The static grid lets a visitor see all 5
   layers at once; a linear pinned relay hides 4/5 at any moment and offers no way to
   jump to a specific layer. **Fix:** add clickable dot navigation (one dot per layer,
   reusing the visual language of `.pswap-dot` from `PortfolioScrollSwap` but as real
   `<button>` elements, not decorative spans) that scrolls directly to a layer.
2. **Fast-scroll readability.** ~~Rev 1 proposed shrinking total relay height to fix
   this~~ — that reasoning was backwards: a shorter scroll distance per layer at the
   same scroll velocity gives *less* time per layer, not more. The actual mitigation
   already existed in rev 1's own band math and didn't need changing: each layer's
   `[start, fadeInEnd, fadeOutStart, end]` opacity curve already reserves 70% of its
   band as a full-opacity "hold" zone (only 15%+15% is transition). That hold zone is
   the real defense against a layer disappearing before it's read. Height is reduced
   in mitigation #3 below for an unrelated reason (total scroll cost) — not this one.
3. **Total added scroll cost.** 500vh (relay) + 300vh (zoom bridge) = 800vh of new
   forced-scroll distance is a real cost on a site meant to be skimmed quickly.
   **Fix:** relay reduced from `total * 100vh` to `total * 80vh` (400vh for 5 layers);
   zoom bridge reduced from `300vh` to `180vh` (this one has no readability
   trade-off — it's a decorative scale animation with no per-frame content to miss,
   so shortening it is a straightforward win).
4. **Screen reader redundancy.** All 5 relay layers exist in the DOM simultaneously
   (only `opacity`/`y` differ), so a screen reader would announce all 5 back-to-back
   regardless of scroll position — not broken, but not equivalent to the sighted
   experience either. **Fix:** the entire visual relay (layers, progress bar, dots) is
   marked `aria-hidden="true"`; a plain `<ul className="sr-only">` (reusing the
   existing `.sr-only` utility already defined in `index.css:1161`) lists the same 5
   skills' name/prof/chips once, in document order, right before it. Dot buttons keep
   `onClick` (for pointer users) but get `tabIndex={-1}` so they don't create a
   focusable-inside-`aria-hidden` violation.
5. **Spotlight glow contrast on light sections.** ~~Rev 1 proposed a CSS `z-index`
   fix~~ — not achievable: a single fixed overlay with any non-negative `z-index`
   always paints above normal in-flow content (CSS stacking order places positioned
   descendants after non-positioned in-flow content regardless of z-index magnitude,
   as long as it's not negative — and negative `z-index` would hide it behind every
   section's own background instead, which defeats the effect entirely). **Fix:**
   make the glow theme-aware instead. An `IntersectionObserver` (inside
   `useSpotlightGlow`) watches the three light sections (`.s-build, .s-exp, .s-cert`)
   and toggles `body.is-on-light-section` when one is centered in the viewport; CSS
   drops the glow's `opacity` to `0.35` in that state (from `1`), reducing — not
   eliminating — the wash on light backgrounds while keeping it fully visible on the
   site's five dark sections (Hero, About, Portfolio, Skills, Contact).

## Context

Reference project [frontendfyi/scroll-animations-with-framer-motion-codesandbox-projects](https://github.com/frontendfyi/scroll-animations-with-framer-motion-codesandbox-projects)
demonstrates three Framer Motion scroll-animation patterns not yet present in this
codebase. This spec adapts three of them to `awahids.my.id`, matching existing
conventions (`useSectionMotion`, GSAP `ScrollTrigger` usage, mobile/desktop split
patterns already used in `PortfolioScrollSwap`).

Site alternates dark and light sections by design (an intentional "editorial
light/dark rhythm" — confirmed by e.g. `.s-build { border-top: 4px solid var(--dark);
}` marking a deliberate hard seam). Dark: Hero, About, Portfolio, Skills, Contact
(`--dark`/`--mid`). Light: WhatIBuild (`.s-build`), Experience (`.s-exp`),
Certificates (`.s-cert`) (`--light: #F4F0E8`). `--lime: #C8FF00` is used as the glow's
single accent color throughout — it's already the accent on both light and dark
sections elsewhere (e.g. hover states in `WhatIBuild`) — but its *intensity* must
adapt per section (see Feature 1).

## Feature 1 — Cursor Spotlight Glow (global)

**Goal:** ambient radial glow that follows the cursor across the whole page, reinforcing
the site's dark, high-contrast identity without competing with `CustomCursor`'s dot/ring.

**Implementation:**
- New hook `src/lib/useSpotlightGlow.js`:
  - Tracks `pointermove` on `window`, throttled via `requestAnimationFrame` (same pattern
    as the parallax loop in `Hero.jsx`).
  - Writes `--spot-x` / `--spot-y` (px) as CSS custom properties on the overlay element.
  - Guards: skip entirely when `window.matchMedia('(hover: hover) and (pointer: fine)')`
    is false, or `prefers-reduced-motion: reduce` is set — mirrors `CustomCursor.jsx`.
  - Also runs an `IntersectionObserver` (same technique already used in `Skills.jsx`
    for the mobile chip-reveal) watching `.s-build, .s-exp, .s-cert` with a shrunk
    `rootMargin: '-45% 0px -45% 0px'` (so it fires when a light section is centered in
    the viewport, not merely a sliver of it visible) and toggles
    `document.body.classList.toggle('is-on-light-section', ...)`.
- New component `src/components/SpotlightGlow.jsx`: a single `<div>` rendered once in
  `App.jsx`, fixed, full-viewport, `pointer-events: none`. Uses the hook internally.
- CSS (in `src/index.css`):
  ```css
  .spotlight-glow {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50; /* below navbar(200)/modal(2000)/cursor(19999+) */
    opacity: 1;
    transition: opacity .4s ease;
    background: radial-gradient(
      circle 420px at var(--spot-x, 50%) var(--spot-y, 50%),
      rgba(200, 255, 0, 0.06),
      transparent 70%
    );
  }
  body.is-on-light-section .spotlight-glow {
    opacity: 0.35;
  }
  ```
  Existing z-index scale (from `index.css`): navbar `200`, modal overlay `2000`, cursor
  `19999`/`20000`. `50` is safely below all of those. Note: a fixed element with any
  non-negative `z-index` always paints above normal in-flow document content
  regardless of the exact number (CSS stacking order puts positioned descendants after
  non-positioned in-flow content) — so `50` vs `2` makes no visual difference here; the
  value only matters relative to the *other* positioned/z-indexed elements listed
  above. The glow sitting visually on top of everything (including text) is accepted
  and mitigated via the light-section opacity drop above, not avoided via z-index.
- Mounted once in `App.jsx` alongside `<CustomCursor />`, rendered for the home route
  only (same gating as `SocialRail` — not on admin/404/AI Lab routes, since those pages
  don't share the same visual language). Note: `CustomCursor` itself has no such gate
  in the existing code — we deliberately don't copy that, the glow is specific to the
  home page.

**Out of scope:** per-section color *hue* variation (only intensity/opacity changes),
glow intensity changes on scroll position within a single section.

## Feature 2 — Skills Section: Pinned Scroll Relay (desktop only)

**Goal:** replace the desktop skills grid with a scroll-scrubbed sequential reveal of
the 5 skill layers (Frontend, Backend, Database, Deployment, AI-Assisted), while
keeping the existing mobile grid untouched.

**Implementation (`src/components/Skills.jsx`):**
- Split render path by the existing `isMobile` state (`max-width: 768px`, already
  tracked in the component):
  - **Mobile:** unchanged — existing `skills-grid` with `staggerGrid`/`cardPop` variants,
    GSAP hover-lift, chip stagger, chip horizontal drift, number reveal all stay as-is.
  - **Desktop:** new `SkillsRelay` sub-component (`src/components/SkillsRelay.jsx`):
    - Outer wrapper `height: ${skillItems.length * 80}vh` (400vh for 5 layers — reduced
      from an initial 500vh purely to cut total forced-scroll cost; see rev 2 mitigation
      #3. This does **not** address fast-scroll readability — that's handled by the
      70% hold-zone in the band math below, unchanged from the original design).
    - Inner `position: sticky; top: 0; height: 100vh` viewport.
    - `useScroll({ target: outerRef, offset: ['start start', 'end end'] })` →
      `scrollYProgress`.
    - Each layer gets an even band: layer `i` of `n` owns
      `[i/n, (i+0.15)/n, (i+0.85)/n, (i+1)/n]` mapped to `opacity` `[0, 1, 1, 0]` and a
      small `y` drift `['24px', '0px', '0px', '-24px']` (`useTransform`), matching the
      `text1Opacity`/`text1Y` pattern from the reference `features.tsx`. 70% of each
      band (`0.15` to `0.85`) holds at full opacity — the readability buffer.
    - Each layer renders: icon, `num` (large, e.g. "01 / 05"), name, `prof`, and the
      chip list (static, no hover/drift — those don't apply in a pinned relay).
    - A persistent progress indicator (thin horizontal bar, reusing the
      `.pswap-progress-bar` visual language from `PortfolioScrollSwap` for consistency)
      shows relay position.
    - **Dot navigation** (rev 2 mitigation #1): one `<button>` per layer (new classes
      `.skills-relay-dots`/`.skills-relay-dot`, styled after `.pswap-dot` but real,
      clickable controls rather than decorative spans). Clicking scrolls directly to
      that layer's mid-band scroll position. Active dot tracked via
      `useMotionValueEvent(scrollYProgress, 'change', ...)` into local state. Scrolls
      via `lenisRef.current.scrollTo(targetY, { duration: 1.2, easing })` — the exact
      easing function already used for anchor-nav in `App.jsx` — with a plain
      `window.scrollTo` fallback if no `lenisRef` is available. Requires threading the
      `lenisRef` (already created via `useLenis()` in `App.jsx`) down as a prop:
      `App.jsx` → `<Skills lenisRef={lenisRef} />` → `<SkillsRelay lenisRef={lenisRef} ... />`.
    - **Accessibility** (rev 2 mitigation #4): the whole `.skills-relay` div (layers,
      progress bar, dots) is `aria-hidden="true"`. Dot buttons additionally get
      `tabIndex={-1}` (mouse/pointer-only shortcut, not part of the tab order — avoids
      a focusable-inside-`aria-hidden` violation). A `<ul className="sr-only">` sibling,
      rendered *before* `.skills-relay`, lists each skill's name/prof/chips as plain
      text — the equivalent content for screen reader / keyboard users, reusing the
      `.sr-only` utility already defined at `index.css:1161`.
- `SkillsScene` (3D background) keeps mounting unconditionally behind both paths — it's
  ambient decoration, not tied to the grid/relay swap.
- Supabase-loaded `skillItems` (via `cms_items` / `skills` collection) feed both paths
  identically — no data-layer changes.
- `useGsapReveal` / `useWordSplit` / `useTextScramble` on the section header
  (`skills-copy`, `s-eyebrow`) are unaffected — they only touch the intro, not the grid.
- The existing "GSAP hover effects" and "chip rows drift" `useEffect`s in `Skills.jsx`
  must be guarded to run only for the **mobile grid** (`if (!isMobile) return;` before
  querying `.skill-card`), since on desktop those DOM nodes won't exist once the relay
  replaces the grid.

**Reduced motion:** relay still pins and swaps layers, but skips the `y` drift and swaps
via instant opacity (no spring/duration), consistent with `noMotionVariant` in
`sectionMotion.js`.

## Feature 3 — Hero → WhatIBuild Zoom Bridge

**Goal:** a dramatic zoom transition using the existing hero photo, bridging Hero/Ticker
into the content-heavy WhatIBuild section.

**Implementation:**
- New component `src/components/HeroZoomBridge.jsx`, inserted in `App.jsx` between
  `<Ticker />` and `<WhatIBuild />`.
- **Desktop (>768px):**
  - Outer section `height: 180vh` (reduced from an initial 300vh — rev 2 mitigation
    #3: this feature is purely decorative with no per-frame content to miss, so
    cutting its forced-scroll cost has no readability trade-off, unlike the relay).
  - Inner `position: sticky; top: 0; height: 100vh`, centered.
  - `useScroll({ target: outerRef, offset: ['start start', 'end end'] })` →
    `scrollYProgress`.
  - Reuses `${import.meta.env.BASE_URL}img/aw.png` (same asset as `Hero.jsx`) in a
    `motion.img`, with progress stops at `[0, 0.6, 1]`:
    - `scale`: `1 → 2.4 → 3.2`
    - `opacity`: stops at `[0, 0.7, 1]` → `1 → 1 → 0` (fades out in the last stretch)
  - A `--dark` wash div behind the photo fades **in** (`opacity` stops at
    `[0, 0.7, 1]` → `0 → 0.5 → 1`) as the section progresses, so the sticky viewport
    itself goes from transparent to solid dark. It then hands off to WhatIBuild's
    light (`--light`) background as a hard cut — matching the site's existing
    intentional light/dark rhythm (see Context section), not a bug to smooth over.
- **Mobile (≤768px):** no pin, no scroll-scrub — renders a lightweight
  `whileInView` crossfade (reuses `sectionItem`/`fadeUp`-style variant from
  `sectionMotion.js`) instead, to avoid adding 180vh of scroll on small screens.
- Respects `prefers-reduced-motion` (`useReducedMotion` from Framer Motion, same pattern
  as `Hero.jsx`) — falls back to a static, non-scaling image with no scroll-linking at
  all.

## Testing / Verification

- Visual check in browser preview (desktop viewport + mobile viewport) for all three
  features, including explicitly checking the spotlight glow on **both** a dark
  section (Hero) and a light section (WhatIBuild) to confirm the opacity drop reads
  correctly.
- Verify `prefers-reduced-motion` fallback for each (via devtools emulation) shows no
  broken/frozen states.
- Verify Skills section still loads Supabase CMS data correctly on both mobile and
  desktop paths.
- Verify no layout shift / CLS regression from the two new tall sections (Skills relay,
  Zoom bridge) — confirm `ScrollTrigger.refresh()` still fires correctly given `App.jsx`
  already calls it after `effectiveLoading` resolves.
- Verify Skills relay dot navigation: clicking each dot scrolls to the corresponding
  layer and marks it active; keyboard `Tab` does **not** stop on the dots (they're
  `tabIndex={-1}`).
- Verify the `.sr-only` skills list is present in the DOM and reads correctly with a
  screen reader (or by inspecting the accessibility tree in devtools), and that
  `.skills-relay` is excluded from the accessibility tree (`aria-hidden="true"`).
- `npm run check` (lint + build) must pass.

## Non-goals

- No changes to `PortfolioScrollSwap`, `CustomCursor`, `Hero.jsx` internals beyond what's
  listed above.
- No new dependencies — everything uses `framer-motion` and `gsap`, both already
  installed.
