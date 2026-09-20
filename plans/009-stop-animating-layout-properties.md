# 009 — Stop animating layout properties in CSS

- **Status**: TODO
- **Commit**: b132b95
- **Severity**: HIGH (cursor) / MEDIUM (dots, tab arrow)
- **Category**: Performance (§5)
- **Estimated scope**: 1 file, 4 rule blocks

## Problem

The playbook: **animate `transform` and `opacity` only.** `width`, `height`,
`margin`, `padding`, `top` and `left` trigger layout, then paint, then
composite. Four sites animate them.

### The cursor — the worst of the four

`#cursor` and `#cursor-ring` are the most constantly-active elements on the
page: every pointer move drives them. Each is declared **twice**, roughly
4,000 lines apart, with different durations and different easings for the same
properties.

```css
/* src/index.css:66-72 — first declaration */
#cursor {
  ...
  will-change: transform, width, height, background, opacity;
  transition: width .25s, height .25s, background .25s;
}
/* src/index.css:74-80 — first declaration */
#cursor-ring { ... transition: width .25s, height .25s, opacity .25s, border-color .25s; }

/* src/index.css:4144-4150 — later duplicate, WINS on width/height */
#cursor-ring {
  transition: width 0.22s cubic-bezier(0.22,1,0.36,1),
              height 0.22s cubic-bezier(0.22,1,0.36,1),
              ...
              border-width 0.18s;
}
/* src/index.css:4151-4157 — later duplicate, WINS on width/height */
#cursor {
  transition: width 0.18s cubic-bezier(0.22,1,0.36,1),
              ...
}
```

So one element animates on three different clocks: `.25s` survives for
`background`, while `width`/`height` run at `.22s` or `.18s` from the later
block. `will-change: width, height` additionally pins a compositor layer while
promising a layout change, which is the worst of both.

The states that trigger the size change are `.cursor-hover`, `.cursor-text` and
`.cursor-magnet` (`src/index.css:81-85`).

### The other two

```css
/* src/index.css:3913-3916 — mobile pagination dots. Active dot widens. */
.pswap-dots--mobile .pswap-dot { width: 6px; height: 6px;
  transition: width .3s var(--ease-standard), background .3s, box-shadow .3s; }
.pswap-dots--mobile .pswap-dot.is-active { width: 18px; ... }

/* src/index.css:1664 — coverflow tab arrow, fires on every active-tile change */
.pcf-tab-arrow { color:var(--lime); font-size:12px; max-width:0; overflow:hidden;
  opacity:0; transition:max-width .3s ease, opacity .3s ease; }
```

## Target

### A. Cursor — one declaration each, driven by `transform`

Consolidate the duplicates into the first declaration and animate `scale`
instead of `width`/`height`. The elements keep a fixed base size; the state
classes scale them.

```css
/* target — src/index.css, replacing the rules at 66 and 74 */
#cursor {
  /* keep every existing property EXCEPT the transition and will-change */
  will-change: transform, opacity;
  transition: transform .18s var(--ease-standard),
              background .25s var(--ease-standard),
              opacity .18s var(--ease-standard);
}
#cursor-ring {
  /* keep every existing property EXCEPT the transition and will-change */
  will-change: transform, opacity;
  transition: transform .22s var(--ease-standard),
              opacity .25s var(--ease-standard),
              border-color .25s var(--ease-standard),
              border-width .18s var(--ease-standard);
}
```

Then, for each state class at ~81-85 that currently changes `width`/`height`,
replace the size change with a `scale()` that produces the same visual size.
**Compute each factor from the existing values**: if the base is `10px` and the
hover state sets `40px`, the factor is `40 / 10 = 4`, so
`transform: scale(4)`. Read the actual numbers in the file; do not assume.

Critical: `src/components/CustomCursor.jsx` writes `transform: translate(...)`
onto these elements every frame via `setPos`. An inline `transform` **replaces**
the stylesheet's `transform`, so a bare `scale()` in CSS would be destroyed.
Therefore the scale must be applied via a CSS custom property that the JS
transform string includes, **or** on a wrapper. Use the custom-property route:

```css
/* target — state classes */
#cursor { --cursor-scale: 1; }
#cursor-ring { --cursor-scale: 1; }
body.cursor-hover #cursor { --cursor-scale: <computed>; }
/* …one line per existing state, same selector shape as today… */
```

and the JS must compose both. **This makes the plan touch a `.jsx` file** — see
Steps.

### B. Pagination dots — `scaleX` instead of `width`

```css
/* target */
.pswap-dots--mobile .pswap-dot {
  width: 18px; height: 6px;
  transform: scaleX(0.3333); transform-origin: center;
  transition: transform .3s var(--ease-standard),
              background .3s var(--ease-standard),
              box-shadow .3s var(--ease-standard);
}
.pswap-dots--mobile .pswap-dot.is-active { transform: scaleX(1); }
```
The base `width` becomes the **active** width (18px) and the resting state is
scaled down: `6 / 18 = 0.3333`. This keeps the layout box constant, so
neighbouring dots no longer reflow — which is itself a visual improvement.
Check the existing gap/margin between dots still reads correctly, since the
boxes are now wider than the visible dots; if the row looks too spread, reduce
the container's `gap` by the difference rather than reintroducing a width
animation.

### C. Coverflow tab arrow — `transform` and `opacity` only

```css
/* target — src/index.css:1664 */
.pcf-tab-arrow {
  color:var(--lime); font-size:12px; opacity:0;
  transform: translateX(-4px);
  transition: transform .25s var(--ease-standard), opacity .25s var(--ease-standard);
}
```
Drop `max-width: 0` and `overflow: hidden` entirely; whatever rule sets
`max-width` on the active state must drop it too, and gain
`transform: translateX(0)`. If removing `max-width: 0` changes the tab's
resting width, the arrow needs a reserved slot — add a fixed `width` to the
arrow instead of animating one.

## Repo conventions to follow

- Motion tokens at `src/index.css:27-30`: `--ease-standard: cubic-bezier(.16,1,.3,1);`,
  `--tr-fast: .2s;`, `--tr-base: .28s;`, `--tr-slow: .55s;`.
- `cubic-bezier(0.22,1,0.36,1)` in the cursor duplicates is a near-copy of the
  token and must be replaced by `var(--ease-standard)`, not preserved.
- `src/components/CustomCursor.jsx` owns the cursor's position. Its `setPos`
  helper is the only place that writes `transform` on those elements.

## Steps

1. Read `src/index.css:81-85` and record the exact `width`/`height` values each
   cursor state sets, plus the base values at 66 and 74. Compute each scale
   factor as `state_size / base_size`. Write them down in your report.
2. Delete the two later duplicate blocks (`#cursor-ring` at ~4144 and `#cursor`
   at ~4151) entirely.
3. Rewrite the `transition` and `will-change` on the rules at 66 and 74 per
   target A. Remove `width` and `height` from `will-change`.
4. Replace each state class's `width`/`height` change with a `--cursor-scale`
   value per target A.
5. In `src/components/CustomCursor.jsx`, find `setPos` and extend the transform
   string it writes so it composes the scale, e.g.
   `translate(Xpx, Ypx) scale(var(--cursor-scale, 1))`. If `setPos` writes via
   `element.style.transform`, `var()` is legal there. Verify by reading the
   function before editing; if it uses `translate3d`, keep `translate3d` and
   append the `scale`.
6. Apply target B to the pagination dots, and check the dot row's spacing.
7. Apply target C to `.pcf-tab-arrow` and its active-state rule.

## Boundaries

- Do NOT change any cursor's **visual** size. The scale factors must reproduce
  today's pixel sizes exactly.
- Do NOT change the cursor's position logic, lerp factor, or magnet behaviour.
- Do NOT remove the reduced-motion rule at ~4268
  (`#cursor, #cursor-ring { transition: none; }`). It is now dead code — commit
  `7bb977f` made CustomCursor return early under reduced motion — but removing
  dead code is a separate concern. Note it in your report instead.
- Do NOT touch `src/components/ProjectCoverflow.jsx` or
  `src/components/PortfolioScrollSwap.jsx`. CSS only, except step 5.
- Do NOT add dependencies.
- If step 5's transform composition cannot be made to work without
  restructuring `CustomCursor.jsx`, STOP after step 4, revert steps 2-4, and
  report — a half-applied cursor change is worse than none.

## Verification

- **Mechanical**:
  - `npm run lint` — zero errors.
  - `npm run build` — `✓ built`.
  - `npm test` — 77 pass, 0 fail.
  - `grep -cE "^#cursor \{|^#cursor-ring \{" src/index.css` — expect **2**
    (one each, down from four).
  - `grep -nE "transition:[^;]*(width|height|max-width)" src/index.css` — expect
    **no output**.
  - `grep -n "cubic-bezier(0.22,1,0.36,1)" src/index.css` — expect no output.
- **Feel check**: run `npm run dev` on a desktop pointer, then:
  - Move the pointer around, then hover a link, a heading, and a `.btn-prime`.
    The cursor and ring must change size exactly as before — same sizes, same
    speed. Compare against `git stash` if unsure.
  - **This is the critical check**: the cursor must still *follow the pointer*.
    If it sticks at the top-left or stops tracking, step 5's transform
    composition broke `setPos` — revert.
  - In DevTools → Performance, record 3 seconds of continuous pointer movement
    over interactive elements. Confirm no "Layout" entries attributable to the
    cursor. Before this change, every hover produced layout work.
  - Scroll to the portfolio swap section on a mobile viewport and step through
    the dots. The active dot should still elongate, and the inactive dots must
    not shift position as it does.
  - Swipe the coverflow and confirm the tab arrow still appears, without the
    text beside it jumping.
- **Done when**: no `transition` in the file names a layout property, the cursor
  tracks the pointer and sizes identically to before, and a Performance trace of
  pointer movement shows no cursor-attributable layout.
