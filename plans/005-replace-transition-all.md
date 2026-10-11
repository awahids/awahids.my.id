# 005 — Replace the two `transition: all` declarations with named properties

- **Status**: DONE
- **Commit**: 30da02f
- **Severity**: HIGH
- **Category**: Performance (§5) — `transition: all`
- **Estimated scope**: 1 file (`src/index.css`), 2 rule blocks

## Problem

`transition: all` animates every animatable property that changes, including
ones the author never intended, and many of those run off the GPU (layout and
paint rather than compositing). The playbook treats it as always a finding.

`src/index.css` has exactly two:

```css
/* src/index.css:2024-2030 — current. Certificate card hover reveal. */
.cert-card-view {
  margin-top: 24px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--dark); opacity: 0; transform: translateY(10px);
  transition: all var(--tr-base) var(--ease-standard);
  display: flex; align-items: center; gap: 6px;
  font-family:'DM Mono',monospace;
}
/* src/index.css:2031 — the only state that changes */
.cert-card:hover .cert-card-view { opacity: 1; transform: translateY(0); }
```

```css
/* src/index.css:3316-3323 — current. FloatingFAQ suggestion chips. */
.ff-suggestion-btn {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: none;
  transition: all var(--tr-fast);
  flex-shrink: 0;
}
/* src/index.css:3326-3330 — the states that change */
.ff-suggestion-btn:hover {
  background: rgba(200, 255, 0, 0.08);
  border-color: rgba(200, 255, 0, 0.4);
  color: var(--lime);
  transform: translateY(-1px);
}
```

The second one is worse than the first: `transition: all var(--tr-fast)` supplies
no easing function at all, so it silently falls back to the CSS `ease` default
and bypasses the repo's `--ease-standard` token — a cohesion problem riding
along with the performance one.

Both live on frequently-hovered elements: certificate cards and the FAQ
suggestion chips.

## Target

Name exactly the properties that actually change between the base rule and the
state rule, and give both an explicit easing token.

```css
/* target — src/index.css, .cert-card-view */
transition: opacity var(--tr-base) var(--ease-standard),
            transform var(--tr-base) var(--ease-standard);
```
Only `opacity` and `transform` change on hover, so those are the only two legs.

```css
/* target — src/index.css, .ff-suggestion-btn */
transition: background var(--tr-fast) var(--ease-standard),
            border-color var(--tr-fast) var(--ease-standard),
            color var(--tr-fast) var(--ease-standard),
            transform 160ms var(--ease-standard);
```
Four properties change on hover: `background`, `border-color`, `color` and
`transform`.

The `transform` leg uses `160ms` rather than `var(--tr-fast)` deliberately: this
element is also a press target in plan 003, and `160ms` is the playbook's
press-feedback duration. Naming it here means plan 003 does not have to touch
this rule at all.

Exact values, do not substitute: `var(--tr-base)` (which is `.28s`) for the
certificate reveal, `var(--tr-fast)` (`.2s`) for the chip's paint properties,
`160ms` for the chip's transform, `var(--ease-standard)` on every leg.

## Repo conventions to follow

- Motion tokens at `src/index.css:27-30`:
  ```css
  --ease-standard: cubic-bezier(.16,1,.3,1);
  --tr-fast: .2s;
  --tr-base: .28s;
  --tr-slow: .55s;
  ```
- Exemplar of a correctly-specified multi-property transition already in this
  file — `src/index.css:2986`:
  ```css
  transition:background var(--tr-fast) ease, color var(--tr-fast) ease, transform var(--tr-fast) ease;
  ```
  Follow its shape (one leg per property), but use `var(--ease-standard)`
  instead of the bare `ease` keyword it uses.
- Multi-line transitions with one property per line are already used in this
  file (for example `src/index.css:4100-4101`); wrapping is fine and preferred
  for the four-leg case.

## Interaction with the other plans

- **Plan 002** rewrites `.cert-card-view` wholesale, because that rule is a
  hover reveal that must be inverted for touch devices, and its target block
  already includes the named-properties transition from this plan. **If plan 002
  has already been applied, `.cert-card-view` will contain no `transition: all`
  and step 1 here becomes a no-op** — verify and skip it.
- **Plan 003** deliberately leaves `.ff-suggestion-btn` alone and defers to this
  plan for its `transform` leg.

Either order works. Just check the current state of each rule before editing.

## Steps

1. In `src/index.css`, find the `.cert-card-view` rule (~line 2024). If it still
   contains `transition: all var(--tr-base) var(--ease-standard);`, replace that
   single declaration with the two-leg version from the Target section. If it
   does not contain `transition: all` (plan 002 already ran), skip this step and
   note it.
2. Find the `.ff-suggestion-btn` rule (~line 3316). Replace
   `transition: all var(--tr-fast);` with the four-leg version from the Target
   section.

## Boundaries

- Do NOT touch any `.jsx` file.
- Do NOT change any `opacity`, `transform`, `background`, `border-color` or
  `color` **value**. Only the `transition` declarations change.
- Do NOT change `var(--tr-base)` to `var(--tr-fast)` or vice versa. The two
  rules intentionally run at different speeds.
- Do NOT add a `transform-origin` or any property not listed in the targets.
- Do NOT add `will-change`.
- Do NOT add dependencies.
- Do NOT search for and "fix" other transitions in this file. There are 94
  `transition:` declarations and 54 use the bare `ease` keyword; consolidating
  those is a separate, un-selected finding. This plan is scoped to the two
  `transition: all` sites only.
- If `grep -n "transition: all" src/index.css` returns hits at lines other than
  the two described (drift since commit 30da02f), STOP and report.

## Verification

- **Mechanical**:
  - `npm run lint` — expect zero errors.
  - `npm run build` — expect `✓ built`.
  - `grep -n "transition: all" src/index.css` — expect **no output**. This is
    the definitive check for this plan.
  - `grep -c "transition: all" src/index.css` — expect `0`.
- **Feel check**: run `npm run dev`, then:
  - Hover a certificate card. The "view" label must still fade in while rising
    the same 10px, at the same speed as before. If it now snaps, a leg is
    missing; if it feels different in speed, the duration token was changed.
  - Hover a FAQ suggestion chip (open the chat widget at bottom-right). Its
    background, border and text colour must still change and it must still lift
    1px. If the lift disappeared, the `transform` leg is missing.
  - In DevTools → Animations panel at 10% playback, hover a certificate card
    and confirm **only** opacity and transform are animating — no other property
    appears in the panel's track list. Before this change, `all` could pull in
    unintended properties.
  - In DevTools → Performance, record while hovering across a row of certificate
    cards and confirm no layout-thrash warnings appear in the summary.
  - In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce",
    hover both elements and confirm behaviour is unchanged from before this plan
    — neither rule has a reduced-motion override today and this plan does not
    add one.
- **Done when**: `grep -n "transition: all" src/index.css` returns nothing, both
  hover interactions look and feel identical to before, and `npm run build`
  passes.
