# 002 — Gate hover-only motion behind a fine-pointer media query

- **Status**: TODO
- **Commit**: 30da02f
- **Severity**: HIGH
- **Category**: Accessibility (§6) — ungated `:hover` motion
- **Estimated scope**: 1 file (`src/index.css`), 13 rule blocks

## Problem

On a touch screen there is no hover. A tap fires the `:hover` state, and
because nothing moves the pointer away afterwards, **the hovered state sticks
until the user taps something else**. Every decorative lift, scale and rotate
in this stylesheet therefore fires on tap and stays applied.

`src/index.css` contains **76** `:hover` rules and exactly **one**
`@media (hover: hover)` block (`src/index.css:102`, which only toggles
`.spotlight-glow { display: block }`). Thirteen `:hover` blocks change
`transform`:

```
232   .nav-cta:hover                              transform: translateY(-1px)
276   .social-rail-link:hover                     transform: translateY(-2px)
1157  .not-found-primary:hover,
      .not-found-secondary:hover                  transform: translateY(-1px)
1255  .journey-item:hover                         transform: translateY(-2px)
1787  .modal-close:hover                          transform: rotate(90deg)
2005  .cert-card:hover .cert-icon                 transform: rotate(10deg) scale(1.1)
2031  .cert-card:hover .cert-card-view            transform: translateY(0)     <-- SPECIAL, see below
2134  .contact-top-link:hover,
      .contact-top-link:focus-visible             transform: translateY(-1px)
2203  .contact-card:hover                         transform: translateY(-4px)
2272  .cc-soc-link:hover span                     transform: translateX(4px)
3157  .floating-faq-toggle:hover                  transform: scale(1.05)
3326  .ff-suggestion-btn:hover                    transform: translateY(-1px)
4244  .build-card:hover, .cert-card:hover         transform: translateY(-2px)
```

`.build-card:hover` / `.cert-card:hover` at 4244 are additionally re-declared
inside a `max-width` block at `src/index.css:4306-4307`, so that lift currently
applies on mobile by design-accident.

### The one block that must NOT simply be gated

`.cert-card-view` is **not decorative** — it is a reveal. Its base state hides
it, and hover brings it in:

```css
/* src/index.css:2024-2030 — current */
.cert-card-view {
  margin-top: 24px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--dark); opacity: 0; transform: translateY(10px);
  transition: all var(--tr-base) var(--ease-standard);
  display: flex; align-items: center; gap: 6px;
  font-family:'DM Mono',monospace;
}
/* src/index.css:2031 — current */
.cert-card:hover .cert-card-view { opacity: 1; transform: translateY(0); }
```

If this one is wrapped in `@media (hover: hover)` like the others, touch users
lose the "view" affordance entirely — it would be permanently invisible. It
needs the opposite treatment: **visible by default on coarse pointers.**

## Target

Two mechanisms, applied separately.

### A. The 12 decorative blocks

Each of these gets wrapped so the transform only applies where hover is real:

```css
/* target pattern — apply to each of the 12 decorative blocks */
@media (hover: hover) and (pointer: fine) {
  .nav-cta:hover { transform:translateY(-1px); box-shadow: 2px 2px 0 var(--dark); }
}
```

The media query text is exactly `@media (hover: hover) and (pointer: fine)` —
both conditions, in that order.

Non-transform declarations inside those blocks (colour, background,
border-color, box-shadow, opacity) **stay ungated**. Colour feedback on tap is
useful and harmless; it is the movement that misbehaves. Where a block mixes
both, split it: leave the paint properties in the original ungated rule, and
move only the `transform` line into the gated rule.

`.contact-top-link` at 2134 has a combined `:hover, :focus-visible` selector.
Keep `:focus-visible` **outside** the media query — keyboard focus must still
show its state on any device.

### B. `.cert-card-view` (line 2024/2031)

```css
/* target */
.cert-card-view {
  margin-top: 24px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--dark); opacity: 1; transform: none;
  transition: opacity var(--tr-base) var(--ease-standard),
              transform var(--tr-base) var(--ease-standard);
  display: flex; align-items: center; gap: 6px;
  font-family:'DM Mono',monospace;
}

@media (hover: hover) and (pointer: fine) {
  .cert-card-view { opacity: 0; transform: translateY(10px); }
  .cert-card:hover .cert-card-view { opacity: 1; transform: translateY(0); }
}
```

Visible by default; the hide-then-reveal behaviour only exists where hover
works. Note this also replaces `transition: all` with named properties, which
is the separate finding handled in plan 005 — doing it here is fine and
expected, since the declaration is being rewritten anyway.

## Repo conventions to follow

- Motion tokens at `src/index.css:27-30`:
  `--ease-standard: cubic-bezier(.16,1,.3,1);`, `--tr-fast: .2s;`,
  `--tr-base: .28s;`, `--tr-slow: .55s;`.
- The only existing hover-capability gate, for the media-query spelling:
  ```css
  /* src/index.css:102 */
  @media (hover: hover) { .spotlight-glow { display: block; } }
  ```
  Note it lacks `and (pointer: fine)`. New blocks written by this plan must
  include both conditions. Do not edit line 102.
- Keep each gated block adjacent to the rule it came from. Do NOT collect all 12
  into one block at the end of the file — this stylesheet is already suffering
  from duplicate selectors declared thousands of lines apart (see plan 005's
  sibling findings), and centralising would make that worse.

## Steps

Work top-to-bottom through `src/index.css` so line numbers stay valid for the
steps below it. After each edit, the lines below shift — re-find the next
selector by name rather than trusting the number.

1. Line 232 `.nav-cta:hover` — wrap the whole rule in the gate. It has no
   non-transform properties worth keeping ungated except `box-shadow`; move both
   inside, since the shadow reads as part of the lift.
2. Line 276 `.social-rail-link:hover` — move only `transform:translateY(-2px);`
   into a gated rule; leave `background`, `border-color` and `color` in the
   original ungated rule.
3. Line 1157 `.not-found-primary:hover, .not-found-secondary:hover` — wrap
   entirely (transform-only rule).
4. Line 1255 `.journey-item:hover` — move only the `transform` into a gated
   rule; leave `background` ungated.
5. Line 1787 `.modal-close:hover` — move only `transform:rotate(90deg);` into a
   gated rule; leave `color`, `background` and `border-color` ungated.
6. Line 2005 `.cert-card:hover .cert-icon` — move only the `transform` into a
   gated rule; leave `background` ungated.
7. Lines 2024 and 2031 `.cert-card-view` — apply mechanism **B** exactly as
   written in the Target section.
8. Line 2134 `.contact-top-link:hover, .contact-top-link:focus-visible` — split
   the selector. Keep the paint properties on the combined
   `:hover, :focus-visible` rule ungated; put `transform:translateY(-1px)` in a
   gated rule that targets `:hover` only, plus an ungated
   `.contact-top-link:focus-visible { transform:translateY(-1px); }` so keyboard
   users keep the movement cue.
9. Line 2203 `.contact-card:hover` — move only the `transform` into a gated
   rule.
10. Line 2272 `.cc-soc-link:hover span` — wrap entirely except the `color`
    change, which stays ungated.
11. Line 3157 `.floating-faq-toggle:hover` — move only `transform: scale(1.05);`
    into a gated rule.
12. Line 3326 `.ff-suggestion-btn:hover` — move only
    `transform: translateY(-1px);` into a gated rule; leave `background`,
    `border-color` and `color` ungated.
13. Line 4244 `.build-card:hover, .cert-card:hover` — wrap entirely
    (transform-only rule).
14. Lines ~4306-4307 — find the `.build-card:hover` / `.cert-card:hover`
    re-declaration inside the `max-width` block and **delete those two
    selectors' transform declarations**. They exist only to apply the lift on
    mobile, which is exactly what this plan removes. If deleting leaves an
    empty rule, delete the rule.

## Boundaries

- Do NOT touch any `.jsx` file. This is a CSS-only plan.
- Do NOT gate `:focus-visible` states. Keyboard focus must work on every device.
- Do NOT gate colour, background, border-color, box-shadow or opacity changes,
  except where a step explicitly says to move them.
- Do NOT edit `src/index.css:102`.
- Do NOT consolidate the 12 gated blocks into one place.
- Do NOT add dependencies.
- Do NOT change the `transform` values themselves — the distances are fine; only
  their applicability changes.
- If a selector named in a step is absent or already gated (drift since commit
  30da02f), SKIP that step, note it, and continue. If more than three steps
  mismatch, STOP and report.

## Verification

- **Mechanical**:
  - `npm run lint` — expect zero errors.
  - `npm run build` — expect `✓ built`.
  - `grep -c "hover: hover" src/index.css` — expect **13** (the pre-existing one
    at line 102 plus the 12 new gates; mechanism B's block is the 13th, and
    steps that split a rule may add one each — any count of 13 or more is
    acceptable, 1 means nothing was applied).
  - `grep -n "transition: all" src/index.css` — expect the `.cert-card-view` hit
    at ~2027 to be **gone** (the `.ff-suggestion-btn` one at ~3322 remains; that
    is plan 005's job).
- **Feel check**: run `npm run dev`, then:
  - **On desktop with a mouse**: hover the nav CTA, a project card, a
    certificate card, a contact card and the FAQ toggle. Every lift, rotate and
    scale must still work exactly as before. If any stopped moving, a gate was
    written wrong.
  - **In DevTools → Toggle device toolbar (mobile emulation), reload**, then tap
    a certificate card, a contact card and the FAQ toggle. Confirm:
    - Nothing lifts, scales or rotates on tap.
    - Nothing stays visually "stuck" in a hovered state after the tap.
    - Colour and background feedback still happens on tap.
  - **On the certificate cards in mobile emulation**: the "view" label must be
    **visible without tapping**. If it is invisible, mechanism B was applied
    incorrectly and touch users have lost the affordance.
  - **Keyboard**: Tab to the contact top-links and confirm the focus state still
    shows its movement in mobile emulation.
- **Done when**: no decorative transform fires on tap in mobile emulation, every
  one still fires on desktop hover, the certificate "view" label is visible by
  default on touch, and `npm run build` passes.
