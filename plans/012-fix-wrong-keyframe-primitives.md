# 012 — Replace two keyframes with the right primitive

- **Status**: DONE
- **Commit**: b132b95
- **Severity**: LOW
- **Category**: Interruptibility (§4)
- **Estimated scope**: 1 file, 2 rule blocks

## Problem

The playbook: CSS **transitions** retarget from the current state mid-flight;
**keyframes** restart from zero. Anything triggered rapidly or reversible must
use transitions.

### A. A glitch keyframe on a hover state

```css
/* src/index.css:4251-4258 (keyframe) and 4259-4261 (trigger) — current */
@keyframes eyebrow-glitch {
  0%   { opacity: 1; transform: translateX(0); }
  8%   { opacity: 0.8; transform: translateX(-2px); clip-path: inset(20% 0 60% 0); }
  10%  { opacity: 1; transform: translateX(2px); clip-path: inset(0); }
  ...
}
.s-eyebrow:hover {
  animation: eyebrow-glitch 0.55s steps(1) forwards;
}
```

Section eyebrows are frequent hover targets. `steps(1) forwards` means
re-entering mid-animation snaps back to frame 0, and there is no reverse path on
hover-out — the element simply holds the final frame. It is also ungated for
touch, so a tap fires it and it sticks (the hover-gating work in commit
`f26dac7` covered `transform` rules, not `animation` ones).

### B. A keyframe animating `content`

```css
/* src/index.css:3430 (trigger) and 3433 (keyframe) — current */
  animation: fftyping 1.5s infinite;
@keyframes fftyping { 0% { content: '.'; } 33% { content: '..'; } 66% { content: '...'; } }
```

`content` is not an interpolable property. Where a browser does not support
discrete `content` keyframes, this silently renders a static `...` and the
typing indicator never animates.

## Target

### A. Gate it, and make it not stick

The glitch is genuine personality on a portfolio and is worth keeping — but only
where hover is real, and only while hovered.

```css
/* target — replace the rule at ~4259 */
@media (hover: hover) and (pointer: fine) {
  .s-eyebrow:hover {
    animation: eyebrow-glitch 0.55s steps(1);
  }
}
```

Exactly two changes: wrap it in the gate, and **drop `forwards`** so the element
returns to its resting state instead of holding the last frame. Keep the
`0.55s` duration, the `steps(1)` timing, and the keyframe itself untouched — the
stepped, non-interpolated feel is the effect.

### B. Three spans and opacity

Replace the `content` keyframe with three dot elements whose opacity is
animated, which every browser interpolates.

```css
/* target — replace the @keyframes fftyping rule */
@keyframes fftyping {
  0%, 100% { opacity: 0.2; }
  50%      { opacity: 1; }
}
```

```css
/* target — replace the .dot-typing::after rule that carries the animation */
.dot-typing { display: inline-flex; gap: 2px; }
.dot-typing span {
  animation: fftyping 1.4s ease-in-out infinite;
}
.dot-typing span:nth-child(2) { animation-delay: 0.2s; }
.dot-typing span:nth-child(3) { animation-delay: 0.4s; }
```

Exact values: `1.4s`, `ease-in-out`, delays `0.2s` and `0.4s`, opacity floor
`0.2`. `ease-in-out` is correct here — the playbook assigns it to constant
ambient motion, and this is an infinite loop, not an entrance.

This requires the markup to contain three `<span>` children. Find where
`dot-typing` is rendered in `src/components/FloatingFAQ.jsx` and replace the
element's empty body with `<span>.</span><span>.</span><span>.</span>`, removing
whatever `::after` content the CSS supplied.

## Repo conventions to follow

- The hover gate spelling, established in commit `f26dac7` and used 14 times:
  `@media (hover: hover) and (pointer: fine)`.
- Motion tokens at `src/index.css:27-30`.
- `ffblink` (`src/index.css:3278`) is an existing opacity-only infinite loop in
  the same widget — imitate its shape.

## Steps

1. Wrap the `.s-eyebrow:hover` rule at ~4259 in the hover gate and delete the
   `forwards` keyword from its `animation` shorthand. Leave `@keyframes
   eyebrow-glitch` completely untouched.
2. Read `src/components/FloatingFAQ.jsx` and locate the `dot-typing` element.
   Give it three `<span>.</span>` children.
3. Replace the `@keyframes fftyping` rule at ~3433 with the opacity version.
4. Replace the rule that currently applies `animation: fftyping` to
   `.dot-typing::after` (~3430) with the three rules from target B, and remove
   the `::after` `content` declaration that fed it.

## Boundaries

- Do NOT change `@keyframes eyebrow-glitch` itself, including its
  `clip-path` steps. Only its trigger changes.
- Do NOT convert the eyebrow glitch to a transition. A stepped glitch is not a
  transition-shaped effect; gating it and dropping `forwards` is the fix.
- Do NOT change `ffblink` or any other FAQ animation.
- Do NOT restyle the typing indicator's size, colour or spacing beyond the
  `display: inline-flex; gap: 2px` needed to lay out three spans.
- Do NOT add dependencies.
- If `.dot-typing` is rendered from a string rather than JSX children, STOP and
  report rather than restructuring the component.

## Verification

- **Mechanical**:
  - `npm run lint`, `npm run build`, `npm test` — clean, 77 pass.
  - `grep -n "content: '\.'" src/index.css` — expect **no output**.
  - `grep -n "eyebrow-glitch 0.55s steps(1) forwards" src/index.css` — expect no
    output.
  - `grep -c "hover: hover) and (pointer: fine)" src/index.css` — expect **15**
    (one more than today's 14).
- **Feel check**: run `npm run dev`, then:
  - Hover a section eyebrow (the `// LIKE_THIS` labels) and move away. The glitch
    should fire, then the text should return to normal. Before this change it
    held the final frame. Hover it repeatedly and quickly — it should not leave
    the text in a broken-looking state.
  - In mobile emulation, tap an eyebrow and confirm **nothing** glitches.
  - Open the FAQ chat and send a message so the typing indicator appears. The
    three dots must pulse in sequence. Confirm all three are visible at rest
    (at 0.2 opacity) rather than appearing one at a time — that is the visible
    difference from the old `content` approach.
  - In DevTools → Animations, confirm three separate animations with staggered
    delays, not one.
  - With reduced motion emulated, confirm the dots still pulse — opacity is a
    comprehension cue and is intentionally kept.
- **Done when**: the eyebrow glitch is gated and self-reverting, the typing
  indicator pulses via opacity on three spans, and no `content` keyframe remains.
