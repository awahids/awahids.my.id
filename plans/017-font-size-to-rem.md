# 017 — Convert every font-size from px to rem

- **Status**: TODO
- **Commit**: 6fa4837
- **Severity**: —
- **Category**: Typography (§15) — respect the user's text-size setting
- **Estimated scope**: 2 CSS files, ~265 declarations

## Problem

The site ignores the browser's text-size setting. A user who raises their
default font size gets **no change at all**.

```
font-size in px   : 260 in src/index.css, plus more in src/components/AnomalousHero.css
font-size in rem  : 1
```

```css
/* src/index.css:38-45 — current. Hard-codes body text at 16px. */
body {
  background: var(--dark);
  color: var(--white);
  font-family: 'DM Mono', monospace;
  font-size: 16px;
  line-height: 1.6;
  ...
}
```

§15: *"Respect the user's text-size setting. Scale layout with the text."*

The good news, confirmed: `html` declares **no** `font-size`
(`src/index.css:32-37`), so the root already equals the user's preference and
`rem` will resolve against it correctly. `-webkit-text-size-adjust: 100%` is
already set. The only thing standing in the way is that every size is px.

## Target

Every `font-size` becomes `rem`, computed against a 16px root so the rendered
result at default settings is **pixel-identical**.

```css
/* target — src/index.css, body */
  font-size: 1rem;
```

Conversion is exactly `px / 16`:

| px | rem | | px | rem |
| --- | --- | --- | --- | --- |
| 9 | 0.5625 | | 26 | 1.625 |
| 10 | 0.625 | | 30 | 1.875 |
| 11 | 0.6875 | | 32 | 2 |
| 12 | 0.75 | | 36 | 2.25 |
| 13 | 0.8125 | | 42 | 2.625 |
| 14 | 0.875 | | 54 | 3.375 |
| 15 | 0.9375 | | 64 | 4 |
| 16 | 1 | | 72 | 4.5 |
| 17 | 1.0625 | | 80 | 5 |
| 18 | 1.125 | | 100 | 6.25 |
| 20 | 1.25 | | 120 | 7.5 |
| 22 | 1.375 | | 130 | 8.125 |
| 23 | 1.4375 | | 200 | 12.5 |

Any value not in the table: divide by 16 and write the exact decimal. Do not
round to two places — `11/16 = 0.6875` must not become `0.69`.

### `clamp()` bounds convert too

There are 45 of them. Both the minimum and the maximum become rem; the middle
`vw` term is left alone.

```css
/* current */  font-size: clamp(36px, 5vw, 64px);
/* target  */  font-size: clamp(2.25rem, 5vw, 4rem);
```

Known and accepted limitation: the `vw` term does not scale with the user's
text setting, so at large settings a clamp can still cap out at its `max`. That
is a partial improvement, not a complete one, and converting the bounds is
strictly better than leaving them px. Do **not** try to fix it by rewriting the
middle term — that would change the responsive curve, which is out of scope.

### Media queries stay in px

`@media (max-width: 768px)` and friends are **viewport** queries, not type.
Leave every media query condition exactly as it is. Only `font-size`
declarations change.

## Three exceptions — the iOS zoom threshold, and an SVG

Two declarations must **stay in px**. Both exist to hit the 16px threshold below
which Safari on iOS zooms the page when a form field receives focus:

```css
/* src/index.css ~3531-3534 — inside a mobile media query. KEEP AS px. */
  .floating-faq-footer input {
    font-size: 16px;
    line-height: 1.35;
  }

/* src/index.css ~3537-3543 — the global guard for every field. KEEP AS px. */
@media (max-width: 768px) {
  input,
  textarea,
  select {
    font-size: 16px;
  }
}
```

`1rem` equals 16px only while the root is 16px. A user who has *reduced* their
text size would drop these below the threshold and get the zoom back, so the
guarantee has to be unconditional. Leave both, and add a one-line comment above
each saying why.

Note the desktop rule `.floating-faq-footer input { font-size: 13px }` at ~3411
**does** convert normally — the zoom behaviour is mobile-only.

One more, in JSX:

```jsx
/* src/components/GlyphPortal.jsx:366 — LEAVE AS IS */
              <text data-gp-glyph ... style={{ ..., fontSize: 100, ... }}>
```

That is inside an SVG `<text>`, so `100` is SVG user units, not CSS pixels, and
the glyph geometry is measured against it. Converting it breaks the portal's
measurement maths.

Ignore `src/components/FloatingFAQ.jsx:559`. It carries a `fontSize: '16px'` but
sits inside a `{/* ... */}` commented-out block and is never rendered.

## Repo conventions to follow

- `:root` at `src/index.css:2-31` holds the design tokens. Do **not** add a root
  `font-size` — `html` deliberately has none so the browser default (the user's
  preference) wins.
- `src/components/AnomalousHero.css` is a per-component stylesheet with its own
  px font-sizes. It gets the same treatment.

## Steps

1. `src/index.css`, `body` rule (~line 42): `font-size: 16px` → `font-size: 1rem`.
2. Convert every other `font-size: <N>px` in `src/index.css` using the table.
   Work through them systematically; there are about 260.
3. Convert the 45 `clamp()` bounds, min and max only.
4. Repeat steps 2-3 for `src/components/AnomalousHero.css`.
5. Add a one-line comment above each of the two iOS anti-zoom rules explaining
   why they stay px.

## Boundaries

- Do NOT add a `font-size` to `html` or `:root`. That would defeat the entire
  change.
- Do NOT touch any `@media` condition.
- Do NOT touch `padding`, `margin`, `gap`, `width`, `height`, `top`, `left`,
  `border`, `border-radius` or any other px value. Only `font-size`.
- Do NOT touch `letter-spacing` or `line-height` — those are the next plan.
- Do NOT convert `src/components/GlyphPortal.jsx:366`.
- Do NOT convert the two iOS anti-zoom rules at ~3532 and ~3540.
- Do NOT round. `13/16 = 0.8125`, not `0.81`.
- Do NOT rewrite the `vw` term inside any `clamp()`.
- Do NOT add dependencies.

## Verification

- **Mechanical**:
  - `npm run lint`, `npm run build`, `npm test` — clean, 77 pass.
  - `grep -cE "font-size:[^;]*[0-9]+px" src/index.css` — expect **0**.
  - `grep -cE "font-size:[^;]*[0-9]+px" src/components/AnomalousHero.css` — expect **0**.
  - `grep -nE "^\s*(html|:root)\s*\{" -A14 src/index.css | grep font-size` — expect
    no output, confirming no root font-size was introduced.
  - `grep -c "font-size" src/index.css` — report the before and after counts; they
    must be identical, since this plan converts and never adds or removes.
- **Feel check**: run `npm run dev`.
  - At the browser's **default** text size, the site must look **pixel-identical**
    to before. Compare against `git stash` if anything looks off — this step is a
    pure unit change and any visible difference is a conversion error.
  - In the browser's settings, set the default font size to **20px**, reload, and
    confirm text now grows. Before this change nothing moved. Expect some tight
    spots, since padding is still px — that is the known limit of this plan and
    is the follow-up, not a bug here.
  - Set it to **12px** and confirm the layout still holds together.
  - Open the FAQ chat on a mobile viewport, focus the input, and confirm iOS does
    not zoom — that is why line 559 stayed px.
  - Visit the AI Lab route and confirm its hero type is unchanged.
  - Check the largest display type (the hero, the section ghost labels) at default
    size — the `clamp()` conversions are where a rounding slip would show most.
- **Done when**: no px font-size remains in either stylesheet, the site is
  pixel-identical at default settings, and text responds to the browser's
  text-size setting.
