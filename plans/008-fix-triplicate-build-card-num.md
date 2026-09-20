# 008 — Delete the duplicate `.build-card-num` rule that overrides the GSAP opt-out

- **Status**: DONE
- **Commit**: b132b95
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (§7) — a correctness bug, not a taste call
- **Estimated scope**: 1 file, 4 lines deleted

## Problem

`.build-card-num` is declared **three** times in `src/index.css`.

```css
/* src/index.css:644 — base layout. Correct, leave alone. */
.build-card-num {
  position:absolute; top:0; left:0;
  width:var(--tab-w); height:var(--tab-h);
  display:flex; align-items:center; justify-content:center;
  font-family:'DM Mono',monospace;
  font-size:10px;
  ...
}

/* src/index.css:3965 — the deliberate opt-out. */
.build-card-num {
  will-change: color, transform;
  transition: none; /* Let GSAP drive */
}

/* src/index.css:4089 — a later duplicate at equal specificity, so it WINS. */
.build-card-num {
  will-change: color, transform;
  transition: color 0.22s ease;
}
```

The rule at 3965 says in a comment that GSAP owns this property. The rule at
4089 silently takes it back. Because they have identical specificity and 4089
comes later, `color` is now driven by a CSS transition **and** a GSAP tween at
the same time:

```jsx
/* src/components/WhatIBuild.jsx:58 — the tween that was meant to own it */
if (numEl) gsap.to(numEl, { color: 'var(--lime)', x: 5, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
```

Two engines interpolating one property means GSAP sets a value each frame while
CSS transitions *toward* each of those values — the tween's easing curve is
smeared by a second 0.22s ease on top of it, and `overwrite: 'auto'` cannot
help because the competing animation is not GSAP's.

This is the same class of defect already fixed for `.btn-ghost` in commit
`2960e53`: a stray late duplicate shadowing the intended rule.

## Target

Delete the rule at 4089 entirely. The rule at 3965 already sets the identical
`will-change`, so nothing is lost.

```css
/* target — src/index.css:3965 survives unchanged, and 4089 is gone */
.build-card-num {
  will-change: color, transform;
  transition: none; /* Let GSAP drive */
}
```

Do not instead "merge" the two by adding a `color` transition to 3965 — that
would keep the bug. The whole point is that GSAP drives `color`, so CSS must
not transition it.

## Repo conventions to follow

- Exemplar of this exact fix, already landed: commit `2960e53` deleted a stray
  second `.btn-ghost` rule and folded its `will-change` into the main
  declaration.
- `transition: none; /* Let GSAP drive */` is the repo's idiom for handing a
  property to GSAP. Respect the comment rather than overriding it.

## Steps

1. In `src/index.css`, locate the **third** `.build-card-num` declaration — the
   one containing `transition: color 0.22s ease;` (~line 4089).
2. Delete that entire rule, including its opening selector line and closing
   brace. If it sits under a section comment that now heads nothing, delete the
   comment too.
3. Verify the rule at ~3965 (`transition: none; /* Let GSAP drive */`) is
   untouched, and the base rule at ~644 is untouched.

## Boundaries

- Do NOT touch the declarations at ~644 or ~3965.
- Do NOT add a `color` transition anywhere for this selector.
- Do NOT touch `src/components/WhatIBuild.jsx` — the GSAP tween is correct.
- Do NOT touch the reduced-motion block at ~4031 which sets
  `.build-card, .build-card-num { will-change: auto; }` — that is intentional
  and correct.
- Do NOT go hunting other duplicate selectors in this file. There are more, and
  consolidating them is a separate un-selected finding.
- Do NOT add dependencies.
- If only two `.build-card-num` declarations exist (drift), STOP and report.

## Verification

- **Mechanical**:
  - `npm run lint` — zero errors.
  - `npm run build` — `✓ built`.
  - `grep -c "^\.build-card-num" src/index.css` — expect **2** (down from 3).
  - `grep -n "transition: color 0.22s ease" src/index.css` — expect **no
    output**.
  - `grep -n "Let GSAP drive" src/index.css` — expect exactly one match.
- **Feel check**: run `npm run dev`, scroll to the "what I build" section, then:
  - Hover a build card and watch its number. The colour shift to lime should
    track the 0.22s GSAP tween cleanly. Before the fix the same change ran
    through two stacked 0.22s curves, so the tell is that it now resolves
    *sooner* and more crisply.
  - Hover on and off rapidly. With CSS out of the way, `overwrite: 'auto'` can
    do its job, so the colour should retarget from wherever it is rather than
    fighting a second interpolation. Nothing should stall mid-colour.
  - In DevTools → Elements, select `.build-card-num` and confirm the computed
    `transition` is `none` (or `all 0s ease 0s`), not `color 0.22s`.
  - In DevTools → Animations at 10% playback, hover a card and confirm only ONE
    animation appears for the number's colour, not two overlapping entries.
- **Done when**: two declarations remain, computed `transition` on the element
  is `none`, and the Animations panel shows a single colour animation.
