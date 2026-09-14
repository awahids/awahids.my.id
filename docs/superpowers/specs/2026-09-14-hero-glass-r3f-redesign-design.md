# Hero Redesign: Glass UI + react-three-fiber (r3f/drei) 3D

## Context

The Hero section currently renders two stacked components in `App.jsx`:
- `AnomalousMatterHero` (`src/components/AnomalousHero.jsx`) — an imperative `three.js`
  scene with a hand-written GLSL shader driving a generative icosahedron ("anomalous
  matter" effect), lime-accented (`#C8FF00`).
- `Hero` (`src/components/Hero.jsx`) — the text/CTA/photo layer: name, role, summary,
  tech chips, CTAs, loaded from Supabase CMS with a static fallback, animated with
  GSAP (kinetic background words, scramble-on-hover headings, pointer parallax) and
  Framer Motion (stagger entrance, scroll parallax).

The site's current visual language (`src/index.css`) is dark/brutalist: `--dark
#0A0A0A` background, `--lime #C8FF00` accent, high-contrast large type, minimal
translucency.

## Goal

Redesign the Hero into a **clean & minimal glass** aesthetic:
- The 3D background scene is rewritten using the `@react-three/fiber` /
  `@react-three/drei` ecosystem (referred to by the user as "ThreeUI") instead of
  raw imperative `three.js`, producing a softer glass/distort look (fresnel-style
  reflections, gentle distortion, subtle particles) rather than the current bold
  generative-noise icosahedron.
- The content layer (`Hero.jsx`) is re-skinned as a frosted glass panel
  (backdrop-blur, thin translucent border, soft glow) using patterns common to
  21st.dev-style component galleries, without rewriting its existing data-loading
  or animation logic.

This is the first of three sections flagged for a 21st.dev/ThreeUI-inspired pass
(Hero, Portfolio, Skills); this spec covers **Hero only**.

## Non-goals

- No changes to `Portfolio.jsx`, `PortfolioScrollSwap.jsx`, `SkillsScene.jsx`, or
  `SkillsRelay.jsx` in this pass.
- No migration of other `three.js` usages in the codebase to r3f — scope is
  limited to the Hero's 3D scene.
- No new global design tokens system — reuse existing CSS custom properties in
  `src/index.css`, adding new ones only where the glass look genuinely needs them
  (e.g. a blur amount, a translucent surface color).
- No new automated test framework introduced for this change.

## Architecture

- Add two dependencies: `@react-three/fiber`, `@react-three/drei` (compatible with
  the existing `three@^0.160.0`).
- `src/components/AnomalousHero.jsx` is rewritten: the imperative
  `GenerativeArtScene` (manual `THREE.Scene`/`WebGLRenderer`/shader setup in a
  `useEffect`) is replaced by a declarative `<Canvas>` (r3f) containing one new
  component, `GlassBlob`, built from drei primitives:
  - `<MeshDistortMaterial>` for the glass/distort surface.
  - `<Environment preset="studio">` (or similar) for reflections/fresnel highlight.
  - Optional `<Sparkles>` for a light particle accent.
  - Slow auto-rotation plus pointer-driven parallax rotation (via r3f's
    `useFrame` + pointer coordinates), mirroring the parallax feel of the current
    scene but with less custom code.
- `src/components/Hero.jsx` keeps its existing structure and logic (Supabase
  profile fetch, GSAP kinetic-word/scramble/parallax effects, Framer Motion
  variants) unchanged. Only its CSS classes gain glass styling — no logic diff.
- Both components continue to be rendered stacked in `App.jsx` exactly as today
  (`<AnomalousMatterHero />` as the 3D background layer, `<Hero />` as the
  foreground content layer) — render order and composition are unchanged.

## Components

- **`GlassBlob`** (new, inside `AnomalousHero.jsx`): a single mesh component with
  minimal props (accent color defaulting to a translucent lime/white, distort
  intensity). Rotation responds to pointer position via r3f's built-in pointer
  handling — no manual `addEventListener`/RAF plumbing needed (r3f/drei replace
  that boilerplate).
- **CSS-only changes** to `.hero-left`, `.hero-photo-wrap`/`.hero-photo-frame`,
  `.hero-proof-chip`, and CTA buttons in `src/index.css`: translucent background,
  `backdrop-filter: blur(...)`, thin border using `--stroke-soft`, larger radius
  (`--radius-lg`), soft shadow. No new component files for this layer.
- No new state management, no new data flow — Supabase fetch and fallback logic
  in `Hero.jsx` is untouched.

## Visual direction

- Background stays dark (`--dark`) to preserve brand continuity; the glass
  surface uses a low-opacity white (`rgba(255,255,255,.04–.08)`) with
  `backdrop-filter: blur(16–24px)`, a hairline border (`--stroke-soft`), and a
  soft ambient shadow.
- Lime (`--lime`) accent usage is reduced in footprint but not removed: a thin
  glow on borders/CTA hover, the eyebrow dot, and a subtle tint in the 3D
  material — not the dominant fill it is today.
- The 3D blob trades the current bold generative-noise look for a glass/frosted
  sphere: gentle `MeshDistortMaterial` distortion (low speed/distort values),
  environment reflections for a "glass" read, slow idle rotation, subtle
  pointer-parallax tilt.

## Error handling / fallback behavior

- If WebGL/Canvas creation fails, the Hero content (`Hero.jsx`) must still render
  correctly on its own — the 3D layer degrading or failing to mount should not
  block or visually break the text/CTA layer, matching current behavior where the
  two layers are independent DOM siblings.
- Existing `prefers-reduced-motion` and mobile (`max-width: 900px`) checks in
  `Hero.jsx` are preserved as-is.
- For `GlassBlob`, auto-rotation and pointer-parallax are skipped when
  `prefers-reduced-motion` is set (checked once on mount, consistent with how
  `Hero.jsx` already gates its GSAP effects).

## Testing / verification

- No unit test framework exists in this project for UI components (consistent
  with all other components under `src/components/`); none is introduced here.
- Verification is manual via the dev server preview:
  - Visual check on desktop viewport and a mobile-width resize.
  - Browser console checked for WebGL/r3f warnings or errors.
  - Before/after screenshot comparison.
  - Confirm reduced-motion and mobile code paths still short-circuit the heavy
    animation work as they do today.

## Open items for implementation planning

- Exact drei preset/props for `Environment` and `MeshDistortMaterial` tuning
  (distort/speed values, environment preset name) will be finalized visually
  during implementation, not prescribed exactly here.
- Whether `<Sparkles>` is kept is a visual call made during implementation based
  on how busy the result looks against the glass content panel.
