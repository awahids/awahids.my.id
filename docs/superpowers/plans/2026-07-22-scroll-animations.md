# Scroll Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three scroll-driven Framer Motion animations to the site — a global, theme-aware cursor spotlight glow, a pinned scroll relay (with dot navigation and an accessible fallback) replacing the desktop Skills grid, and a pinned zoom-transition bridge between Hero and WhatIBuild.

**Architecture:** Three independent, additive features. Each ships as its own small component(s) + CSS block + a one-line mount/wire-in change to an existing file. `Skills.jsx` additionally needs its desktop render path replaced and two `useEffect`s scoped to mobile-only, plus a new `lenisRef` prop threaded down from `App.jsx` for the relay's dot navigation.

**Tech Stack:** React 18, `framer-motion` ^10.16.4 (already a dependency — uses `useScroll`, `useTransform`, `useReducedMotion`, `useMotionValueEvent`), plain CSS (`src/index.css`). No new dependencies.

**Testing convention:** This repo has no automated test suite (no Jest/Vitest — verified, only `eslint` + `vite build` via `npm run check`). Verification here means: (1) `npm run check` passes after each code change, (2) manual visual/interaction check in a running dev server (`npm run dev`), per this project's own convention for frontend work.

**Spec:** `docs/superpowers/specs/2026-07-22-scroll-animations-design.md` (rev 2 — includes UX mitigations: dot navigation, screen-reader fallback list, theme-aware glow opacity, reduced scroll-length on the two pinned sections).

---

## Task 1: Cursor Spotlight Glow — hook + component

**Files:**
- Create: `src/lib/useSpotlightGlow.js`
- Create: `src/components/SpotlightGlow.jsx`

- [ ] **Step 1: Write `src/lib/useSpotlightGlow.js`**

```js
import { useEffect } from 'react';

const LIGHT_SECTION_SELECTOR = '.s-build, .s-exp, .s-cert';

export const useSpotlightGlow = (elementRef) => {
  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined') return undefined;

    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) return undefined;

    let rafId = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;

    const applyPosition = () => {
      el.style.setProperty('--spot-x', `${targetX}px`);
      el.style.setProperty('--spot-y', `${targetY}px`);
      rafId = 0;
    };

    const handlePointerMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!rafId) rafId = window.requestAnimationFrame(applyPosition);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const lightSections = Array.from(document.querySelectorAll(LIGHT_SECTION_SELECTOR));
    let observer;
    if (lightSections.length) {
      observer = new IntersectionObserver(
        (entries) => {
          const anyLightInView = entries.some((entry) => entry.isIntersecting);
          document.body.classList.toggle('is-on-light-section', anyLightInView);
        },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      lightSections.forEach((section) => observer.observe(section));
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      document.body.classList.remove('is-on-light-section');
    };
  }, [elementRef]);
};
```

This mirrors the `hasFinePointer`/`prefersReducedMotion` guard pattern already used in
`src/components/CustomCursor.jsx`, the rAF-throttled pointer loop pattern already used
in `src/components/Hero.jsx`, and the `IntersectionObserver` pattern already used for
mobile chip-reveal in `src/components/Skills.jsx`. The `rootMargin: '-45% 0px -45% 0px'`
shrinks the observer's effective viewport to a thin band around vertical center, so the
light-section state flips when a light section is roughly centered on screen (where the
cursor glow visually matters), not merely when a sliver of it is visible.

- [ ] **Step 2: Write `src/components/SpotlightGlow.jsx`**

```jsx
import React, { useRef } from 'react';
import { useSpotlightGlow } from '../lib/useSpotlightGlow';

const SpotlightGlow = () => {
  const glowRef = useRef(null);
  useSpotlightGlow(glowRef);

  return <div className="spotlight-glow" ref={glowRef} aria-hidden="true" />;
};

export default SpotlightGlow;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/useSpotlightGlow.js src/components/SpotlightGlow.jsx
git commit -m "feat: add cursor spotlight glow hook and component"
```

---

## Task 2: Cursor Spotlight Glow — CSS + mount

**Files:**
- Modify: `src/index.css` (insert after the `#cursor`/`#cursor-ring` block, before `/* PRELOADER */`)
- Modify: `src/App.jsx`

- [ ] **Step 1: Add CSS to `src/index.css`**

Find this exact block (ends the `/* CURSOR */` section, right before `/* PRELOADER */`):

```css
body.cursor-magnet #cursor { width:24px; height:24px; }
body.cursor-magnet #cursor-ring { width:90px; height:90px; opacity:.75; border-color:var(--lime); border-width:2px; box-shadow:0 0 20px rgba(200,255,0,0.25); }

/* PRELOADER */
```

Replace it with:

```css
body.cursor-magnet #cursor { width:24px; height:24px; }
body.cursor-magnet #cursor-ring { width:90px; height:90px; opacity:.75; border-color:var(--lime); border-width:2px; box-shadow:0 0 20px rgba(200,255,0,0.25); }

/* SPOTLIGHT GLOW */
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

/* PRELOADER */
```

A fixed element with any non-negative `z-index` always paints above normal in-flow
document content (CSS stacking order puts positioned descendants after non-positioned
in-flow content, regardless of the exact z-index number). So the glow visually sits on
top of text/content by construction — the `body.is-on-light-section` rule is what
actually protects legibility on the site's three light sections (WhatIBuild,
Experience, Certificates), not the z-index value.

- [ ] **Step 2: Mount `SpotlightGlow` in `src/App.jsx`**

Add the import next to the other component imports (after `import CustomCursor from './components/CustomCursor';`):

```js
import CustomCursor from './components/CustomCursor';
import SpotlightGlow from './components/SpotlightGlow';
import SocialRail from './components/SocialRail';
```

Find this render block:

```jsx
      <CustomCursor />
      {!adminPage && <Navbar isAiLabPage={aiLabPage} isNotFoundPage={notFoundPage} />}
      {!aiLabPage && !adminPage && !notFoundPage && <MobileNav />}
      {!aiLabPage && !adminPage && !notFoundPage && <SocialRail />}
```

Replace it with:

```jsx
      <CustomCursor />
      {!aiLabPage && !adminPage && !notFoundPage && <SpotlightGlow />}
      {!adminPage && <Navbar isAiLabPage={aiLabPage} isNotFoundPage={notFoundPage} />}
      {!aiLabPage && !adminPage && !notFoundPage && <MobileNav />}
      {!aiLabPage && !adminPage && !notFoundPage && <SocialRail />}
```

(Gated the same way as `SocialRail` — home route only. `CustomCursor` itself has no
such gate in the existing code; we deliberately don't copy that, since the glow is
specific to the home page's visual language.)

- [ ] **Step 3: Verify build**

Run: `npm run check`
Expected: lint + build both pass (the pre-existing `react-hooks/exhaustive-deps`
warning on `App.jsx` is unrelated and may still appear — that's fine).

- [ ] **Step 4: Browser verification**

Start the dev server (`npm run dev`), open the home page:
- Move the mouse around the **Hero** section (dark background) — confirm a visible
  lime radial glow follows the cursor.
- Scroll to **WhatIBuild** (`#services`, light/cream background) — confirm the glow is
  still there but visibly dimmer than on Hero (the `is-on-light-section` opacity drop).
  Confirm body text readability isn't noticeably hurt where the glow overlaps it.
- Scroll to **Experience** and **Certificates** (also light) — confirm the same dimmed
  behavior.
- Scroll back to a dark section (About, Skills, Contact) — confirm the glow returns to
  full strength.
- Resize the browser to a narrow/mobile width, or use devtools device emulation —
  confirm the glow does **not** render (gated on `hover: hover` + `pointer: fine`).
- In devtools, emulate `prefers-reduced-motion: reduce` — confirm the glow does not
  render/update.
- Check the browser console for errors.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/App.jsx
git commit -m "feat: mount theme-aware cursor spotlight glow on home route"
```

---

## Task 3: Skills Relay — component

**Files:**
- Create: `src/components/SkillsRelay.jsx`

- [ ] **Step 1: Write `src/components/SkillsRelay.jsx`**

```jsx
import React, { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion';

const LAYER_VH = 80;
const LENIS_EASE = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

const LayerPanel = ({ skill, index, total, scrollYProgress, reduceMotion }) => {
  const band = 1 / total;
  const start = index * band;
  const end = start + band;
  const fadeInEnd = start + band * 0.15;
  const fadeOutStart = end - band * 0.15;

  const opacity = useTransform(
    scrollYProgress,
    [start, fadeInEnd, fadeOutStart, end],
    [0, 1, 1, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [start, fadeInEnd, fadeOutStart, end],
    reduceMotion ? ['0px', '0px', '0px', '0px'] : ['24px', '0px', '0px', '-24px']
  );

  return (
    <motion.div className="skills-relay-layer" style={{ opacity, y }}>
      <div className="skills-relay-icon">{skill.icon}</div>
      <div className="skills-relay-num">
        {skill.num} / {String(total).padStart(2, '0')}
      </div>
      <h3 className="skills-relay-name">{skill.name}</h3>
      <div className="skills-relay-prof">{skill.prof}</div>
      <div className="skills-relay-chips">
        {skill.chips.map((chip) => (
          <span key={chip} className="skill-chip">{chip}</span>
        ))}
      </div>
    </motion.div>
  );
};

const SkillsRelay = ({ skillItems, lenisRef }) => {
  const outerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const total = skillItems.length;

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const index = Math.min(total - 1, Math.max(0, Math.floor(progress * total)));
    setActiveIndex((current) => (current === index ? current : index));
  });

  const handleDotClick = (index) => {
    const outer = outerRef.current;
    if (!outer) return;
    const bandHeight = outer.offsetHeight / total;
    const targetY = outer.offsetTop + index * bandHeight + bandHeight / 2;

    if (lenisRef?.current) {
      lenisRef.current.scrollTo(targetY, { duration: 1.2, easing: LENIS_EASE });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  return (
    <>
      <ul className="sr-only">
        {skillItems.map((skill) => (
          <li key={skill.name}>
            {skill.name} — {skill.prof}: {skill.chips.join(', ')}
          </li>
        ))}
      </ul>
      <div
        className="skills-relay"
        ref={outerRef}
        aria-hidden="true"
        style={{ height: `${total * LAYER_VH}vh` }}
      >
        <div className="skills-relay-sticky">
          <div className="skills-relay-progress">
            <motion.div
              className="skills-relay-progress-fill"
              style={{ scaleX: progressScaleX }}
            />
          </div>
          {skillItems.map((skill, index) => (
            <LayerPanel
              key={skill.name}
              skill={skill}
              index={index}
              total={total}
              scrollYProgress={scrollYProgress}
              reduceMotion={reduceMotion}
            />
          ))}
          <div className="skills-relay-dots">
            {skillItems.map((skill, index) => (
              <button
                key={skill.name}
                type="button"
                className={`skills-relay-dot${index === activeIndex ? ' is-active' : ''}`}
                onClick={() => handleDotClick(index)}
                tabIndex={-1}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SkillsRelay;
```

Notes on choices that trace back to the spec's rev-2 mitigations:
- `LAYER_VH = 80` (400vh total for 5 layers, not 500vh) — cuts total forced-scroll
  cost. The 70% opacity "hold" zone inside each band (`fadeInEnd` at 15%,
  `fadeOutStart` at 85%) is unchanged — that's the actual defense against a layer
  flashing by unread, independent of total height.
- The `<ul className="sr-only">` (reuses the existing `.sr-only` utility already
  defined in `src/index.css:1161`) gives screen readers the same 5 skills as a plain
  linear list, once — instead of letting them encounter all 5 relay layers stacked in
  the DOM regardless of scroll position.
- `.skills-relay` carries `aria-hidden="true"` so its (redundant, decorative-relative-
  to-the-list-above) content is skipped by assistive tech. The dot buttons are real
  `<button>`s for pointer users but `tabIndex={-1}` so they don't become
  keyboard-focusable inside an `aria-hidden` subtree (which would be an accessibility
  violation).
- `lenisRef` is optional (`lenisRef?.current`) — falls back to native `window.scrollTo`
  if not provided, so this component doesn't hard-fail without it.
- `offset: ['start start', 'end end']` is the standard Framer Motion mapping for a
  `position: sticky; top: 0` pin spanning a container of `N * LAYER_VH` — matches the
  band-per-item pattern from the reference repo's `features.tsx`, adapted from their
  `top: 16.7vh` sticky offset to this project's `top: 0`.

- [ ] **Step 2: Commit**

```bash
git add src/components/SkillsRelay.jsx
git commit -m "feat: add SkillsRelay pinned scroll component with dot nav and a11y fallback"
```

---

## Task 4: Skills Relay — CSS + wire into Skills.jsx + thread lenisRef

**Files:**
- Modify: `src/index.css` (append new block after the existing skills CSS, i.e. after the line `.skills-grid .skill-card.reveal { transition-delay: var(--skill-delay, 0ms); }` and before `/* PORTFOLIO */`)
- Modify: `src/components/Skills.jsx`
- Modify: `src/App.jsx` (thread `lenisRef` down to `<Skills />`)

- [ ] **Step 1: Add CSS to `src/index.css`**

Find:

```css
.skills-grid .skill-card.reveal { transition-delay: var(--skill-delay, 0ms); }

/* PORTFOLIO */
```

Replace with:

```css
.skills-grid .skill-card.reveal { transition-delay: var(--skill-delay, 0ms); }

/* SKILLS RELAY (desktop pinned scroll) */
.skills-relay {
  position: relative;
  width: 100%;
}
.skills-relay-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.skills-relay-progress {
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  width: min(480px, 60%);
  height: 2px;
  background: rgba(255,255,255,.07);
  overflow: hidden;
  border-radius: 2px;
  z-index: 2;
}
.skills-relay-progress-fill {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, var(--lime), #e8ff80);
  transform-origin: left center;
}
.skills-relay-layer {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 48px;
  will-change: transform, opacity;
}
.skills-relay-icon {
  width: 48px; height: 48px;
  color: var(--lime);
  margin-bottom: 24px;
}
.skills-relay-icon svg { width:100%; height:100%; stroke:currentColor; fill:none; stroke-width:1.5; }
.skills-relay-num {
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(255,255,255,.42);
  margin-bottom: 12px;
}
.skills-relay-name {
  font-family: 'Unbounded', sans-serif;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 900;
  letter-spacing: -.03em;
  color: var(--white);
  line-height: 1.05;
  margin-bottom: 10px;
}
.skills-relay-prof {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(200,255,0,.7);
  margin-bottom: 28px;
}
.skills-relay-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: 640px;
}
.skills-relay-dots {
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2;
}
.skills-relay-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.08);
  padding: 0;
  cursor: pointer;
  transition: background .3s var(--ease-standard), transform .3s var(--ease-standard), box-shadow .3s;
}
.skills-relay-dot:hover {
  background: rgba(200,255,0,.4);
}
.skills-relay-dot.is-active {
  background: var(--lime);
  border-color: var(--lime);
  transform: scale(1.5);
  box-shadow: 0 0 8px rgba(200,255,0,.55);
}
@media (prefers-reduced-motion: reduce) {
  .skills-relay-dot { transition: none; }
}

/* PORTFOLIO */
```

`.skill-chip` (used inside `.skills-relay-chips`) is reused as-is from the existing
grid styling — no new chip styles needed. `.skills-relay-dot` is styled after
`.pswap-dot`/`.pswap-dot.is-active` (same visual language — small dot, lime when
active, glow shadow) but is a real `<button>`, so it adds `cursor: pointer` and a
`:hover` state that `.pswap-dot` (a non-interactive decorative span) doesn't need.

- [ ] **Step 2: Import `SkillsRelay` in `src/components/Skills.jsx`**

Find:

```js
import SkillsScene from './SkillsScene';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
```

Replace with:

```js
import SkillsScene from './SkillsScene';
import SkillsRelay from './SkillsRelay';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
```

- [ ] **Step 3: Accept `lenisRef` as a prop**

Find:

```js
const Skills = () => {
```

Replace with:

```js
const Skills = ({ lenisRef }) => {
```

- [ ] **Step 4: Guard the hover-effects `useEffect` to mobile only**

Find:

```js
  // GSAP hover effects — replace anime.js entirely
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (prefersReducedMotion || !hasFinePointer) return undefined;
```

Replace with:

```js
  // GSAP hover effects — replace anime.js entirely
  // Desktop no longer renders `.skill-card` (SkillsRelay takes over) — mobile only.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined' || !isMobile) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (prefersReducedMotion || !hasFinePointer) return undefined;
```

Then find the end of that same effect:

```js
    return () => cleanups.forEach((fn) => fn());
  }, [skillItems.length]);

  // GSAP ScrollTrigger: animate skill card numbers on enter
```

Replace with:

```js
    return () => cleanups.forEach((fn) => fn());
  }, [skillItems.length, isMobile]);

  // GSAP ScrollTrigger: animate skill card numbers on enter
```

- [ ] **Step 5: Guard the chip-drift `useEffect` to mobile only, and add a ScrollTrigger refresh safety effect**

Find:

```js
  // GSAP ScrollTrigger: chip rows drift horizontally as user scrolls (alternating dirs)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      const chipLists = Array.from(root.querySelectorAll('.skill-card-list'));
```

Replace with:

```js
  // GSAP ScrollTrigger: chip rows drift horizontally as user scrolls (alternating dirs)
  // Desktop no longer renders `.skill-card-list` (SkillsRelay takes over) — mobile only.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined' || !isMobile) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      const chipLists = Array.from(root.querySelectorAll('.skill-card-list'));
```

Then find the end of that effect:

```js
    }, root);

    return () => ctx.revert();
  }, [skillItems.length]);

  return (
    <section className="s-skills" id="skills">
```

Replace with:

```js
    }, root);

    return () => ctx.revert();
  }, [skillItems.length, isMobile]);

  // Relay height depends on skillItems.length and is much taller (N*80vh) than the
  // grid it replaces — recalc GSAP ScrollTrigger positions for triggers further down
  // the page after it settles (async Supabase load, or the mobile/desktop switch).
  useEffect(() => {
    if (isMobile || typeof window === 'undefined') return undefined;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 50);
    return () => window.clearTimeout(id);
  }, [skillItems.length, isMobile]);

  return (
    <section className="s-skills" id="skills">
```

- [ ] **Step 6: Replace the grid render with a mobile/desktop conditional**

Find:

```jsx
        <motion.div
          className="skills-grid"
          variants={staggerGrid}
        >
          {skillItems.map((skill, index) => (
            <motion.div
              key={index}
              className="skill-card"
              variants={cardPop}
            >
              <div className="skill-card-icon">{skill.icon}</div>
              <div className="skill-card-num">{skill.num}</div>
              <div className="skill-card-content">
                <h3 className="skill-card-name">{skill.name}</h3>
                <div className="skill-card-prof">{skill.prof}</div>
                <div className="skill-card-list">
                  {skill.chips.map(chip => (
                    <span key={chip} className="skill-chip">{chip}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};
```

Replace with:

```jsx
        {isMobile ? (
          <motion.div
            className="skills-grid"
            variants={staggerGrid}
          >
            {skillItems.map((skill, index) => (
              <motion.div
                key={index}
                className="skill-card"
                variants={cardPop}
              >
                <div className="skill-card-icon">{skill.icon}</div>
                <div className="skill-card-num">{skill.num}</div>
                <div className="skill-card-content">
                  <h3 className="skill-card-name">{skill.name}</h3>
                  <div className="skill-card-prof">{skill.prof}</div>
                  <div className="skill-card-list">
                    {skill.chips.map(chip => (
                      <span key={chip} className="skill-chip">{chip}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <SkillsRelay skillItems={skillItems} lenisRef={lenisRef} />
        )}
      </motion.div>
    </section>
  );
};
```

- [ ] **Step 7: Thread `lenisRef` from `App.jsx` into `<Skills />`**

Find:

```jsx
            <Portfolio />
            <Skills />
            <Experience />
```

Replace with:

```jsx
            <Portfolio />
            <Skills lenisRef={lenisRef} />
            <Experience />
```

(`lenisRef` is already created in `App.jsx` via `const lenisRef = useLenis({ enabled: lenisEnabled });` — no new state needed, just passing the existing ref down.)

- [ ] **Step 8: Verify build**

Run: `npm run check`
Expected: lint + build both pass.

- [ ] **Step 9: Browser verification — desktop**

`npm run dev`, desktop-width viewport, scroll to the **Skills** section (`#skills`):
- Confirm the section pins and the viewport stays fixed while you keep scrolling.
- Confirm each of the 5 layers (Frontend, Backend, Database, Deployment & Automation,
  AI-Assisted Development) fades in, holds, then fades out in order as you scroll.
- Confirm the thin progress bar at the top fills left-to-right in sync with scroll.
- Confirm the dot column on the right updates its active dot as you scroll.
- **Click a dot for a layer other than the current one** — confirm the page smooth-
  scrolls directly to that layer and it becomes visible/active without having to
  scroll through the layers in between.
- Confirm `SkillsScene` (3D background) is still visible/animating behind the relay.
- Confirm the page unpins cleanly after the last layer and continues to Experience.
- Open devtools → Elements → Accessibility tree (or run axe/Lighthouse) on the Skills
  section: confirm `.skills-relay` is excluded from the tree (`aria-hidden`), the 5
  `.sr-only` list items ARE present in the tree, and the dot buttons are NOT reachable
  via `Tab` from the keyboard.
- Check the browser console for errors (in particular Framer Motion `useScroll` target
  warnings).

- [ ] **Step 10: Browser verification — mobile**

Resize to a mobile width (≤768px) or use device emulation:
- Confirm the Skills section shows the **original card grid** (icon, number, name,
  chips, hover/tap stagger reveal) — unchanged from before this task.
- Confirm no pinned relay renders here (scroll length for this section should look the
  same as before this plan).

- [ ] **Step 11: Browser verification — reduced motion**

Emulate `prefers-reduced-motion: reduce` at desktop width:
- Confirm layers still swap (pin still works — only the drift/opacity easing style
  changes, per the `reduceMotion` branch in `LayerPanel`), with no frozen or invisible
  layers.

- [ ] **Step 12: Commit**

```bash
git add src/index.css src/components/Skills.jsx src/App.jsx
git commit -m "feat: replace desktop Skills grid with pinned scroll relay"
```

---

## Task 5: Hero Zoom Bridge — component

**Files:**
- Create: `src/components/HeroZoomBridge.jsx`

- [ ] **Step 1: Write `src/components/HeroZoomBridge.jsx`**

```jsx
import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const fadeUp = {
  hidden: { opacity: 0, y: 40, scale: 0.94 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const HeroZoomBridge = () => {
  const outerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { isMobile } = useSectionMotion();

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 2.4, 3.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const wash = useTransform(scrollYProgress, [0, 0.7, 1], [0, 0.5, 1]);

  const photoSrc = `${import.meta.env.BASE_URL}img/aw.png`;

  if (reduceMotion) {
    return (
      <section className="hzb hzb-static" aria-hidden="true">
        <img src={photoSrc} alt="" className="hzb-photo" draggable="false" />
      </section>
    );
  }

  if (isMobile) {
    return (
      <motion.section
        className="hzb hzb-mobile"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        aria-hidden="true"
      >
        <img src={photoSrc} alt="" className="hzb-photo" draggable="false" />
      </motion.section>
    );
  }

  return (
    <section className="hzb hzb-desktop" ref={outerRef} aria-hidden="true">
      <div className="hzb-sticky">
        <motion.div className="hzb-wash" style={{ opacity: wash }} />
        <motion.img
          src={photoSrc}
          alt=""
          className="hzb-photo"
          style={{ scale, opacity }}
          draggable="false"
        />
      </div>
    </section>
  );
};

export default HeroZoomBridge;
```

`alt=""` + `aria-hidden="true"` on the whole section: this reuses the same portrait
photo already announced with real alt text in `Hero.jsx` — this instance is a purely
decorative transition, so it's intentionally silent for screen readers.

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroZoomBridge.jsx
git commit -m "feat: add HeroZoomBridge pinned zoom transition component"
```

---

## Task 6: Hero Zoom Bridge — CSS + mount

**Files:**
- Modify: `src/index.css` (append after the hero photo block, i.e. after the line `.hero-photo-img { ... user-select:none; -webkit-user-drag:none; }` and before `/* Floating stat cards */`)
- Modify: `src/App.jsx`

- [ ] **Step 1: Add CSS to `src/index.css`**

Find:

```css
.hero-photo-img {
  width:100%; height:auto; max-height:92vh;
  object-fit:contain; object-position:bottom center;
  display:block; position:relative; z-index:1;
  filter:grayscale(12%) contrast(1.06) brightness(0.96);
  user-select:none; -webkit-user-drag:none;
}

/* Floating stat cards */
```

Replace with:

```css
.hero-photo-img {
  width:100%; height:auto; max-height:92vh;
  object-fit:contain; object-position:bottom center;
  display:block; position:relative; z-index:1;
  filter:grayscale(12%) contrast(1.06) brightness(0.96);
  user-select:none; -webkit-user-drag:none;
}

/* HERO ZOOM BRIDGE */
.hzb-desktop {
  position: relative;
  height: 180vh;
}
.hzb-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--dark);
}
.hzb-wash {
  position: absolute;
  inset: 0;
  background: var(--dark);
  pointer-events: none;
}
.hzb-photo {
  position: relative;
  z-index: 1;
  max-height: 70vh;
  width: auto;
  object-fit: contain;
  filter: grayscale(12%) contrast(1.06) brightness(0.96);
  user-select: none;
  -webkit-user-drag: none;
}
.hzb-mobile {
  display: flex;
  justify-content: center;
  padding: 48px var(--section-pad-x-mobile, 20px);
  background: var(--dark);
}
.hzb-mobile .hzb-photo,
.hzb-static .hzb-photo {
  max-height: 40vh;
}
.hzb-static {
  display: flex;
  justify-content: center;
  padding: 48px var(--section-pad-x, 48px);
  background: var(--dark);
}

/* Floating stat cards */
```

`180vh` (reduced from an initial 300vh) — this feature is purely decorative (a scale
animation with no per-frame content a user could miss), so shortening it is a
straightforward reduction in forced-scroll cost with no readability trade-off, unlike
the Skills relay. The bridge ends in `var(--dark)` and hands off to WhatIBuild's light
(`--light`) background as a hard cut — matching the site's existing intentional
light/dark section rhythm (e.g. `.s-build { border-top: 4px solid var(--dark); }`
already marks a deliberate hard seam between sections), so no cross-fade to light is
needed here.

- [ ] **Step 2: Mount `HeroZoomBridge` in `src/App.jsx`**

Add the import next to the other component imports (after `import Ticker from
'./components/Ticker';`):

```js
import Ticker from './components/Ticker';
import HeroZoomBridge from './components/HeroZoomBridge';
import Footer from './components/Footer';
```

Find:

```jsx
            <Hero />
            <Ticker />

            <WhatIBuild />
```

Replace with:

```jsx
            <Hero />
            <Ticker />
            <HeroZoomBridge />

            <WhatIBuild />
```

- [ ] **Step 3: Verify build**

Run: `npm run check`
Expected: lint + build both pass.

- [ ] **Step 4: Browser verification — desktop**

`npm run dev`, desktop-width viewport, scroll from Hero through Ticker into the new
bridge section:
- Confirm the portrait photo pins centered and scales up dramatically (up to ~3.2x) as
  you scroll through the section.
- Confirm it fades out near the end of the section and WhatIBuild appears immediately
  after (hard cut into the light section is expected, not a bug).
- Confirm no layout jump/flash when the pin releases.
- Check the browser console for errors.

- [ ] **Step 5: Browser verification — mobile**

Resize to ≤768px:
- Confirm there's **no** pinned scroll section — instead a normal-height section with
  the photo fading/sliding up into view once as you scroll past it (`whileInView`,
  `once: true`).

- [ ] **Step 6: Browser verification — reduced motion**

Emulate `prefers-reduced-motion: reduce`:
- Confirm the bridge renders as a static, non-scaling image with no scroll-linked
  behavior and no extra scroll length.

- [ ] **Step 7: Commit**

```bash
git add src/index.css src/App.jsx
git commit -m "feat: mount HeroZoomBridge between Hero and WhatIBuild"
```

---

## Task 7: Final regression pass

**Files:** none (verification only)

- [ ] **Step 1: Full build check**

Run: `npm run check`
Expected: lint + build both pass (same pre-existing warning noted in Task 2 is
acceptable; no new errors or warnings).

- [ ] **Step 2: Full page scroll-through, desktop width**

`npm run dev`, scroll the entire home page top to bottom:
- Spotlight glow follows the cursor consistently, dimming on WhatIBuild/Experience/
  Certificates and returning to full strength on Hero/About/Portfolio/Skills/Contact.
- Hero → Ticker → zoom bridge → WhatIBuild transition plays once, cleanly.
- Skills section pins, relays through all 5 layers (with working dot navigation), then
  releases into Experience.
- `PortfolioScrollSwap`'s own pin (GSAP-based, untouched by this plan) still works
  correctly further up the page — confirms the two different pin mechanisms (GSAP pin
  vs. CSS `position: sticky`) don't fight each other on the same page.
- No console errors, no visible layout shift/flash between sections.

- [ ] **Step 3: Full page scroll-through, mobile width (≤768px)**

Same scroll-through at a mobile viewport:
- Skills shows the original grid, not the relay.
- Zoom bridge shows the lightweight crossfade, not the pin.
- Spotlight glow does not render (no fine pointer).
- Total mobile page length looks reasonable (no leftover empty scroll space from a
  feature that should have used its mobile fallback).

- [ ] **Step 4: `prefers-reduced-motion: reduce` full pass**

Same scroll-through with reduced motion emulated:
- No frozen mid-transition states anywhere in the three new features.
- No console errors.

- [ ] **Step 5: Accessibility spot-check**

With the dev server running, tab through the entire home page using only the keyboard:
- Confirm focus never lands on a Skills relay dot (they're `tabIndex={-1}`).
- Confirm focus order otherwise proceeds normally through real interactive elements
  (nav links, CTA buttons, portfolio "Open Case" buttons, etc.) — the new decorative
  sections (`SpotlightGlow`, `HeroZoomBridge`, the visual half of `SkillsRelay`) should
  be fully invisible to both `Tab` and screen reader traversal.

- [ ] **Step 6: Fix any issues found, then final commit**

If Steps 2–5 surface any issue, fix it in the relevant file and commit the fix with a
message describing what was wrong (e.g. `fix: <what was broken>`). If nothing needed
fixing, no commit is needed for this task.
