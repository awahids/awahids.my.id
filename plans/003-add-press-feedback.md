# 003 — Add press feedback to pressable elements

- **Status**: DONE
- **Commit**: 30da02f
- **Severity**: HIGH
- **Category**: Physicality & origin (§3) — press feedback
- **Estimated scope**: 1 file (`src/index.css`), 7 selectors + 1 shared rule

## Problem

`src/index.css` is 4,679 lines and contains **76** `:hover` rules but exactly
**two** `:active` rules:

```css
/* src/index.css:1534 */
.pcf-stage:active { cursor:grabbing; }          /* cursor only — not motion */

/* src/index.css:2994 */
.tab-item:active { transform:translateY(1px); } /* the only real press state */
```

So nothing on this site acknowledges a press. Every button hovers but none
depresses. On touch devices — where hover does not exist at all (see plan 002)
— that leaves the primary buttons with **no** interactive feedback beyond a
colour change.

The affected elements, with the transitions they currently declare:

```css
/* src/index.css:392,404 — primary CTA. Transitions box-shadow only. */
.btn-prime { ... transition:box-shadow var(--tr-fast); display:inline-block; }

/* src/index.css:410,413 */
.btn-ghost { ... text-decoration:none; transition:border-color var(--tr-fast), color var(--tr-fast); }

/* src/index.css:223,230 */
.nav-cta { ... color:var(--dark); padding:9px 20px; border:none; cursor:none;
           transition: transform var(--tr-fast), box-shadow var(--tr-fast); }

/* src/index.css:3142,3154 */
.floating-faq-toggle { ... cursor: none;
                       transition: transform var(--tr-base), background var(--tr-base); }

/* src/index.css:3348-3358 — the chat send button, a FREQUENT target */
.floating-faq-footer button {
  background: var(--lime);
  color: var(--dark);
  border: none;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: none;
  transition: background var(--tr-fast);
}

/* src/index.css:3316-3323 */
.ff-suggestion-btn { ... cursor: none; transition: all var(--tr-fast); flex-shrink: 0; }

/* src/index.css:4553 */
.rg-btn-primary { ... cursor: pointer; ... }
```

Note `.nav-cta` and `.floating-faq-toggle` already transition `transform`, so
they only need the `:active` rule. The others need `transform` added to their
transition list as well.

## Target

The playbook's press-feedback spec, used verbatim:

> `transform: scale(0.97)` on `:active` with `transition: transform 160ms ease-out`.
> Keep it subtle (0.95–0.98).

Exact values, do not substitute:
- scale on press: `0.97`
- transition duration for the transform: `160ms`
- easing: `var(--ease-standard)` (the repo's ease-out token, `src/index.css:27`)

The playbook also calls for **asymmetric timing**: the deliberate phase (the
press) may be slower, the system's response snaps back. `160ms` is the press
transition; the release reuses the same declaration, which is acceptable here
because 160ms is already near-instant. Do not add a separate release duration.

One shared rule covers every target:

```css
/* target — add once, near the other button rules */
.btn-prime:active,
.btn-ghost:active,
.nav-cta:active,
.floating-faq-toggle:active,
.floating-faq-footer button:active,
.ff-suggestion-btn:active,
.rg-btn-primary:active {
  transform: scale(0.97);
}
```

And each target's `transition` gains a `transform` leg where it lacks one:

```css
/* target — .btn-prime */
transition: box-shadow var(--tr-fast), transform 160ms var(--ease-standard);

/* target — .btn-ghost */
transition: border-color var(--tr-fast), color var(--tr-fast), transform 160ms var(--ease-standard);

/* target — .floating-faq-footer button */
transition: background var(--tr-fast), transform 160ms var(--ease-standard);

/* target — .rg-btn-primary */
transition: transform 160ms var(--ease-standard);
```

`.nav-cta` and `.floating-faq-toggle` already have a `transform` leg. Change
their existing `transform var(--tr-fast)` / `transform var(--tr-base)` to
`transform 160ms var(--ease-standard)` so the press timing matches the rest.

`.ff-suggestion-btn` currently uses `transition: all var(--tr-fast)`. Leave that
shorthand alone in this plan — plan 005 rewrites it and will include the
`transform` leg. Adding the `:active` rule here is enough; `all` already covers
`transform`.

### Reduced motion

A 3% scale is a small, non-vestibular cue and the playbook is explicit that
reduced motion means *fewer and gentler*, not zero — press feedback is exactly
the kind of comprehension aid it says to keep. Do **not** add a reduced-motion
override for this rule.

## Repo conventions to follow

- Motion tokens at `src/index.css:27-30`:
  `--ease-standard: cubic-bezier(.16,1,.3,1);`, `--tr-fast: .2s;`,
  `--tr-base: .28s;`, `--tr-slow: .55s;`. There is no 160ms token; write
  `160ms` literally rather than inventing one, so this plan stays a single
  concern. (`--tr-fast` is 200ms — close, but the playbook specifies 160ms and
  values from it are not to be approximated.)
- The existing press-state exemplar to imitate structurally:
  ```css
  /* src/index.css:2994 */
  .tab-item:active { transform:translateY(1px); }
  ```
- Buttons in this stylesheet use `cursor: none` because a custom cursor is
  drawn by `src/components/CustomCursor.jsx`. Leave every `cursor` declaration
  exactly as it is.

## Steps

1. In `src/index.css`, find `.btn-prime` (~line 392). In its `transition`
   declaration, change
   `transition:box-shadow var(--tr-fast);`
   to
   `transition:box-shadow var(--tr-fast), transform 160ms var(--ease-standard);`
2. Find `.btn-ghost` (~line 410). Change
   `transition:border-color var(--tr-fast), color var(--tr-fast);`
   to
   `transition:border-color var(--tr-fast), color var(--tr-fast), transform 160ms var(--ease-standard);`
3. Find `.nav-cta` (~line 223). Change
   `transition: transform var(--tr-fast), box-shadow var(--tr-fast);`
   to
   `transition: transform 160ms var(--ease-standard), box-shadow var(--tr-fast);`
4. Find `.floating-faq-toggle` (~line 3142). Change
   `transition: transform var(--tr-base), background var(--tr-base);`
   to
   `transition: transform 160ms var(--ease-standard), background var(--tr-base);`
5. Find `.floating-faq-footer button` (~line 3348). Change
   `transition: background var(--tr-fast);`
   to
   `transition: background var(--tr-fast), transform 160ms var(--ease-standard);`
6. Find `.rg-btn-primary` (~line 4553). It has no `transition` declaration. Add
   `transition: transform 160ms var(--ease-standard);` inside the rule.
7. Immediately after the `.btn-ghost` rule (so the shared press rule sits with
   the other button styles rather than at the end of the file), insert the
   shared `:active` rule exactly as written in the Target section — all seven
   selectors, one `transform: scale(0.97);` declaration.

## Boundaries

- Do NOT touch any `.jsx` file.
- Do NOT add `whileTap` props to Framer Motion components. Five already exist
  (`src/components/Hero.jsx:180,191`, `src/components/Contact.jsx:97,108`) and
  mixing a CSS `:active` scale with a Framer `whileTap` on the same element
  would compound the two transforms. If a selector in this plan turns out to be
  applied to an element that already has `whileTap`, SKIP that selector and note
  it.
- Do NOT change any `cursor` declaration.
- Do NOT rewrite `.ff-suggestion-btn`'s `transition: all` — that is plan 005.
- Do NOT add a `prefers-reduced-motion` override for the press scale.
- Do NOT change hover states.
- Do NOT add dependencies.
- Do NOT invent a `--tr-press` token; write `160ms` literally.
- If a selector named in a step is absent (drift since commit 30da02f), SKIP
  that step, note it, and continue.

## Verification

- **Mechanical**:
  - `npm run lint` — expect zero errors.
  - `npm run build` — expect `✓ built`.
  - `grep -c ":active" src/index.css` — expect **9** or more (the 2 pre-existing
    plus the 7 new selectors in the shared rule).
  - `grep -c "transform 160ms var(--ease-standard)" src/index.css` — expect
    **6**.
- **Feel check**: run `npm run dev`, then press and hold (do not release) each
  of: the hero primary CTA, a ghost button, the nav CTA, the FAQ toggle, the
  chat send button, a FAQ suggestion chip, and the README generator's primary
  button. Confirm:
  - Each visibly shrinks slightly while held, and springs back on release.
  - The shrink is **subtle** — if it reads as a "pop" or a bounce, the scale
    value is wrong; it must be exactly `0.97`.
  - The element does not shift position or wobble; only its size changes.
  - Nothing jumps. If a button both shrinks and lifts at the same time, it has a
    conflicting hover transform still applied — note which one.
  - In DevTools → Animations panel at 10% playback, press a button and confirm
    the scale change completes in roughly a sixth of a second, not slower.
  - In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce",
    press the buttons again and confirm the press feedback **still happens**. It
    is intentionally not disabled.
  - In mobile emulation, tap-and-hold the chat send button and the FAQ toggle
    and confirm the press feedback fires on touch.
- **Done when**: all seven element types depress on press in both the default
  and reduced-motion states, nothing overshoots, and `npm run build` passes.
