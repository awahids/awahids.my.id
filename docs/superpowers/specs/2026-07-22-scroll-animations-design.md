# Scroll Animations — Design Spec

Date: 2026-07-22
Status: Approved

## Context

Reference project [frontendfyi/scroll-animations-with-framer-motion-codesandbox-projects](https://github.com/frontendfyi/scroll-animations-with-framer-motion-codesandbox-projects)
demonstrates three Framer Motion scroll-animation patterns not yet present in this
codebase. This spec adapts three of them to `awahids.my.id`, matching existing
conventions (`useSectionMotion`, GSAP `ScrollTrigger` usage, mobile/desktop split
patterns already used in `PortfolioScrollSwap`).

Site is fully dark-themed (`--dark: #0A0A0A` on `body` and nearly every section), so a
single global accent color (`--lime: #C8FF00`) is used for the glow effect instead of
per-section theming.

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
- New component `src/components/SpotlightGlow.jsx`: a single `<div>` rendered once in
  `App.jsx`, fixed, full-viewport, `pointer-events: none`, `z-index` above section
  backgrounds but below content/cursor. Uses the hook internally.
- CSS (in `src/index.css`):
  ```css
  .spotlight-glow {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50; /* above normal section flow, below navbar(200)/modal(2000)/cursor(19999+) */
    background: radial-gradient(
      circle 420px at var(--spot-x, 50%) var(--spot-y, 50%),
      rgba(200, 255, 0, 0.06),
      transparent 70%
    );
  }
  ```
  Existing z-index scale (from `index.css`): navbar `200`, modal overlay `2000`, cursor
  `19999`/`20000`. `50` keeps the glow safely below all of those while still sitting
  above normal in-flow section content (which is un-positioned or uses low local
  z-index values inside their own stacking context, so it doesn't need to compete
  numerically — it only must stay under `200`).
- Mounted once in `App.jsx` alongside `<CustomCursor />`, rendered for the home route
  only (same gating as `CustomCursor`/`SocialRail` — not on admin/404/AI Lab routes,
  since those pages don't share the same visual language).

**Out of scope:** per-section color variation, glow intensity changes on scroll.

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
    - Outer wrapper `height: ${skillItems.length * 100}vh` (500vh for 5 layers).
    - Inner `position: sticky; top: 0; height: 100vh` viewport.
    - `useScroll({ target: outerRef, offset: ['start start', 'end end'] })` →
      `scrollYProgress`.
    - Each layer gets an even band: layer `i` of `n` owns
      `[i/n, (i+0.15)/n, (i+0.85)/n, (i+1)/n]` mapped to `opacity` `[0, 1, 1, 0]` and a
      small `y` drift `['24px', '0px', '0px', '-24px']` (`useTransform`), matching the
      `text1Opacity`/`text1Y` pattern from the reference `features.tsx`.
    - Each layer renders: icon, `num` (large, e.g. "01 / 05"), name, `prof`, and the
      chip list (static, no hover/drift — those don't apply in a pinned relay).
    - A persistent progress indicator (thin vertical or horizontal bar, reusing the
      `.pswap-progress-bar` visual language from `PortfolioScrollSwap` for consistency)
      shows relay position.
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
  - Outer section `height: 300vh`.
  - Inner `position: sticky; top: 0; height: 100vh`, centered.
  - `useScroll({ target: outerRef, offset: ['start start', 'end end'] })` →
    `scrollYProgress`.
  - Reuses `${import.meta.env.BASE_URL}img/aw.png` (same asset as `Hero.jsx`) in a
    `motion.img`, with:
    - `scale`: `[0.1, 0.6, 1] → [1, 2.4, 3.2]`
    - `opacity`: `[0.7, 1] → [1, 0]` (fades out in the last stretch so WhatIBuild can
      take over)
  - A background color wash (`--dark` → transparent) crossfades under it so the
    transition doesn't hard-cut.
- **Mobile (≤768px):** no pin, no scroll-scrub — renders a lightweight
  `whileInView` crossfade (reuses `sectionItem`/`fadeUp`-style variant from
  `sectionMotion.js`) instead, to avoid adding 300vh of scroll on small screens.
- Respects `prefers-reduced-motion` (`useReducedMotion` from Framer Motion, same pattern
  as `Hero.jsx`) — falls back to a static, non-scaling image with no scroll-linking at
  all.

## Testing / Verification

- Visual check in browser preview (desktop viewport + mobile viewport, light/dark N/A
  since site is single-theme) for all three features.
- Verify `prefers-reduced-motion` fallback for each (via devtools emulation) shows no
  broken/frozen states.
- Verify Skills section still loads Supabase CMS data correctly on both mobile and
  desktop paths.
- Verify no layout shift / CLS regression from the two new tall sections (Skills relay,
  Zoom bridge) — confirm `ScrollTrigger.refresh()` still fires correctly given `App.jsx`
  already calls it after `effectiveLoading` resolves.
- `npm run check` (lint + build) must pass.

## Non-goals

- No changes to `PortfolioScrollSwap`, `CustomCursor`, `Hero.jsx` internals beyond what's
  listed above.
- No new dependencies — everything uses `framer-motion` and `gsap`, both already
  installed.
