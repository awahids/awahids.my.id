# PRD Generator: AI-assisted PRD authoring with owner-scoped persistence

> **Superseded (2026-09-19).** The PRD generator moved to its own app, `awahids/aw-prd` (`prd.awahids.my.id`), with Google login and a subscription gate; see `docs/superpowers/specs/2026-09-19-prd-subscription-template-design.md` in that repo. This site keeps only a promo page at `/prd-generator`. Kept for history.

**Status:** Design approved 2026-09-19. Not yet implemented.

## Context

The site already ships one generator of this shape, and this design deliberately
follows it rather than inventing a second pattern:

- **Route** — `/readme-generator`, registered in `src/App.jsx` through a
  hand-rolled pathname router (`README_GENERATOR_PATH` at line 31,
  `normalizePathname`, `isReadmeGeneratorRoute`, and a matching clause in
  `isNotFoundRoute`). There is no react-router in the project. The page is
  lazy-loaded and, notably, **linked from nowhere** — the only other mention of
  it anywhere in `src/` is its own CSS class.
- **Wizard** — `src/components/ReadmeGenerator.jsx` (283 lines): a fixed 4-step
  wizard (`STEPS`, line 18) with local `useState` and a `previewTab` toggle.
- **Deterministic template** — `src/lib/readmeTemplate.js` exposes a pure
  `buildReadmeMarkdown(data, opts)`, covered by 13 tests in
  `src/lib/readmeTemplate.test.js`.
- **AI endpoint** — `api/readme-assistant.js` composes the house guards:
  `ensureMethod`, `createRateLimiter`, `parseLimitedString`,
  `isOutOfScopeRequest`, `callSumopodChat`, `parseJsonLenient`,
  `toSafeErrorResponse`, with prompt/parse logic isolated in
  `api/_lib/readmeAssistant.js`.

The PRD structure this feature must produce is defined by the
`wahid-toolkit:prd-writer` skill: nine mandatory sections and three mandatory
Mermaid diagrams (a `flowchart` under User Flow, a `sequenceDiagram` under
Architecture, an `erDiagram` under Database Schema), plus a required
"short description → at least five context-specific clarifying questions →
draft" flow.

> The user also pointed at `github.com/awahids/aw-prd` as the format reference.
> That repository returns 404 without authentication and the local `gh` CLI is
> not logged in, so it could not be read. The structure here therefore comes
> from the `prd-writer` skill alone. If `aw-prd` diverges from it, this spec
> needs revisiting.

Flow diagrams are meant to land in `github.com/awahids/drawnix` — a fork of
`plait-board/drawnix`, currently in sync with upstream `develop`. Its README
documents Mermaid-syntax-to-flowchart conversion and export to PNG / `.drawnix`.
Mermaid text is therefore a supported, documented import path; the internal
`.drawnix` JSON format is not relied on anywhere in this design, because it
belongs to an upstream project this repo does not control.

## Goal

Add a hidden `/prd-generator` page that turns a short product description into a
complete, `prd-writer`-shaped PRD, and persist PRDs that the owner saves so that
a later MCP server and kanban board have a stable API to build on.

Two audiences, deliberately asymmetric:

- **Public visitors** get the full generator, rate- and length-limited, and
  nothing they generate is stored. Copy and download only.
- **The owner** can persist a PRD through an authenticated endpoint and share it
  by permalink.

## Scope

**In scope**

1. `/prd-generator` wizard: describe → clarify → review.
2. Two AI endpoints: clarifying-question generation, then draft generation.
3. A deterministic Markdown assembler owning all nine headings.
4. Per-diagram "copy Mermaid" affordances plus a link out to drawnix.
5. Daily quota (persistent) and length caps.
6. A `prds` table, an owner-authenticated write endpoint, a public read
   endpoint, and a `/prd/<slug>` permalink page.

**Explicitly out of scope** (each becomes its own spec)

- The MCP server / claude.ai connector. `POST /api/prd-save` is designed to be
  the endpoint it will call, but nothing MCP-specific is built here. Note that a
  local stdio MCP server and a remote claude.ai connector have materially
  different requirements (the latter needs hosting and OAuth); which one to build
  has not been investigated and warrants its own spike.
- Kanban board, task entities, task breakdown per PRD. The
  `wahid-toolkit:task-breakdown` skill is the intended content source for that
  work, not a new generator. The intended UI is
  `arhamkhnz/next-shadcn-admin-dashboard`, which is **Next.js 16 + TypeScript +
  Tailwind v4 + shadcn/ui** — a stack this repo does not use (Vite 4, React 18,
  plain JavaScript, one hand-written stylesheet). It therefore cannot be dropped
  into this SPA, and that spec will have to decide between a separate Next.js
  application talking to the same API and a port that keeps only the design.
  Either way `POST /api/prd-save` and the `prds` table defined here are the
  contract it consumes, so that decision does not affect this spec.
- Multi-user accounts. See "Identity" for why.
- Rendering Mermaid to images in the browser.
- Any refactor of `ReadmeGenerator.jsx`.

## Architecture

### Routing

`/prd-generator` follows the existing four-touchpoint pattern in `src/App.jsx`:
a path constant, a route predicate, a clause in `isNotFoundRoute`, and a
`lazy()` render branch. No nav entry — the page is reachable only by URL, the
same as `/readme-generator`.

`/prd/<slug>` is different and is the riskiest routing change here: all three
existing predicates test **exact equality** against a normalized pathname, while
the permalink needs **prefix matching**. `isNotFoundRoute` must learn about it
too, and getting that wrong silently breaks the 404 page for real URLs. This
needs an explicit test of the predicate helpers.

### Files

| File | Responsibility |
|---|---|
| `src/lib/prdTemplate.js` | Pure assembler. Owns the nine headings, their order, the front-matter block, table rendering, Mermaid fencing. Knows nothing about AI or HTTP. |
| `src/lib/prdTemplate.test.js` | `node:test`, mirroring `readmeTemplate.test.js`. |
| `src/components/PrdGenerator.jsx` | Shell and three-step state machine. |
| `src/components/PrdDescribeStep.jsx` | Step 0. |
| `src/components/PrdQuestionsStep.jsx` | Step 1 — renders AI-generated questions whose shape is unknown until runtime. |
| `src/components/PrdReviewStep.jsx` | Step 2 — preview/raw tabs, copy, download, three Mermaid blocks with copy + drawnix link, owner save. |
| `src/components/PrdPermalink.jsx` | Read-only view for `/prd/<slug>`. |
| `api/prd-questions.js` | Stage 1 endpoint. |
| `api/prd-draft.js` | Stage 2 endpoint. |
| `api/prd-save.js` | Owner-only write. |
| `api/prd-get.js` | Public read by slug. |
| `api/_lib/prdAssistant.js` | Prompts, parsing, sanitizing — mirrors `readmeAssistant.js`. |
| `api/_lib/prdQuota.js` | Persistent daily quota. |
| `api/_lib/prdStore.js` | Supabase reads/writes for `prds`. |
| `api/_tests/prdAssistant.test.js`, `api/_lib/prdQuota.test.js`, `api/_lib/prdStore.test.js` | Tests. |
| `supabase/prd.sql` | Table, RLS, quota function. Idempotent, matching `page-views.sql`. |

**Why four components instead of one.** `ReadmeGenerator.jsx` keeps everything
inline at 283 lines, which is near the comfortable limit for a form whose fields
are all static. The PRD clarify step renders a form whose shape is only known at
runtime, and the review step carries three diagram blocks plus copy, download and
save. Combined, that file would pass 600 lines and become hard to follow.

### Existing code that must change

- `api/_lib/requestGuards.js` — `getClientIp` is currently a module-private
  helper used only by `createRateLimiter`. The quota module needs it, so it must
  be exported.

## Contracts

### Wizard state machine

| Step | Content | Action |
|---|---|---|
| 0 Describe | Optional system name, short description (≤1200 chars) | `POST /api/prd-questions` |
| 1 Clarify | AI questions, plus an always-present free-text "anything else" field | `POST /api/prd-draft` |
| 2 Review | Preview/raw tabs, copy, download `.md`, three Mermaid blocks, owner save | — |

### `POST /api/prd-questions`

Request `{ description, projectName? }`.
Response `{ questions: [{ id, text, kind: 'choice' | 'text', options? }], meta }`.

The prompt asks for five to eight questions derived from the description; the
server clamps to eight. **If the model returns fewer than five, the server does
not retry.** A retry doubles the cost of the cheapest call for a marginal gain,
and the always-present free-text field on step 1 is a deterministic safety net
for context no question happened to cover. This is a conscious, documented
deviation from the skill's "minimum five" wording.

### `POST /api/prd-draft`

Request `{ description, projectName?, answers: [{ id, question, answer }] }`.
Response is **structured JSON per section, not Markdown**:

```json
{
  "meta": { "systemName": "...", "systemKind": "standalone|integrated" },
  "overview": { "definition": "...", "problem": "...", "goal": "..." },
  "requirements": [{ "category": "...", "items": ["..."] }],
  "coreFeatures": [{ "module": "...", "features": [{ "name": "...", "desc": "..." }] }],
  "userFlow": { "steps": ["..."], "flowchart": ["flowchart TD", "  A[Start] --> B{Check}"] },
  "architecture": { "stackRationale": "...", "integration": "...", "folders": "...", "sequence": ["sequenceDiagram", "..."] },
  "database": { "conventions": "...", "erd": ["erDiagram", "..."], "tables": [{ "name": "...", "columns": "...", "types": "...", "notes": "..." }] },
  "api": { "principles": "...", "groups": [{ "group": "...", "endpoints": [{ "method": "...", "path": "...", "auth": "...", "note": "..." }] }] },
  "constraints": { "tech": [{ "layer": "...", "choice": "...", "rationale": "..." }], "conventions": "..." },
  "assumptions": ["..."]
}
```

**Mermaid is returned as an array of lines, never a newline-joined string.** This
is the specific mitigation for the escaping fragility that is otherwise the main
weakness of a JSON-based approach: embedded newlines inside fenced diagram
source are exactly where lenient JSON parsing tends to break.

### `prdTemplate.js`

`buildPrdMarkdown(content, opts) -> string`. It owns structure; the model only
supplies prose and diagram lines.

**Deliberate divergence from `readmeTemplate.js`:** the README template omits
sections whose inputs are empty. This template **always renders all nine
headings**, and marks an empty one with an explicit
`> [belum terisi — lengkapi manual]` note. A silently missing section in a PRD is
a defect, not a feature; an explicit marker surfaces it during review.
`assumptions` render as `[asumsi: ...]` per the skill's requirement.

## Identity

The write path cannot reuse the `security definer` RPC pattern from
`supabase/page-views.sql`. That pattern is safe there because the anon key is
shipped to the browser (`VITE_`-prefixed, with fallbacks in
`api/_lib/supabaseRest.js:5` and `api/_lib/cms.js:8`) and the worst an attacker
can do is bump a view counter. An anon-callable RPC that inserts arbitrary PRD
rows would let anyone with DevTools fill the table.

**Decision: writes use a server-only Supabase service role key.**

- `SUPABASE_SERVICE_ROLE_KEY`, read **without any `VITE_` fallback** — a
  deliberate departure from the four existing Supabase helpers.
- RLS enabled with **no insert or update policy at all**, so no anon write path
  exists even under misconfiguration.
- Public `select` policy so permalinks resolve without a session.
- Owner authentication at the HTTP layer: `POST /api/prd-save` compares
  `Authorization: Bearer <token>` against `PRD_OWNER_KEY` from env — the same
  server-holds-the-secret shape already used for `SUMOPOD_API_KEY`. The
  comparison must be length-independent (constant-time) rather than `===`.

**How the browser sends that token without shipping it.** The owner key must
never be bundled, so it is not a `VITE_` variable and not baked into the page.
Instead the review step's save control asks the owner to paste the key once; it
is held in `sessionStorage` for that tab only and sent as the bearer token. For
every other visitor the control simply never gets a key, which is consistent
with public generations being ephemeral. The alternative — no save button at all,
persisting only through the future MCP path — was rejected because it would leave
the whole persistence layer unexercised until MCP exists.

**Hazard, stated plainly:** if the service role key is ever given a `VITE_`
prefix, Vite inlines it into the client bundle and the entire database is
exposed, because the service role bypasses RLS. `api/_lib/prdStore.js` must
**fail loudly** when the key is only present as `VITE_SUPABASE_SERVICE_ROLE_KEY`
rather than quietly using it, and a test must lock that behaviour in.

**Why not Supabase Auth with real accounts.** `src/lib/supabaseClient.js:16`
disables sessions outright (`persistSession: false`, `autoRefreshToken: false`,
`detectSessionInUrl: false`), and no file in `src/` references
`supabase.auth`. `SUPABASE_CMS.md` still documents an admin panel at
`/admin/experience` with Google OAuth, but that panel was **removed** in commit
`afea5be` ("refactor: hardcode site content and remove the admin CMS") — the doc
is stale. Reintroducing auth would reverse a deliberate past decision for a
single-owner portfolio, so a shared owner secret is the proportionate choice.
(The stale `SUPABASE_CMS.md` is a separate cleanup, not part of this work.)

## Persistence

```sql
create table if not exists public.prds (
  id text primary key,
  slug text unique not null,
  system_name text not null,
  version text not null default '1.0',
  status text not null default 'draft',
  source text not null default 'web',
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Column conventions follow `supabase/experience-cms.sql` (`id text primary key`,
`timestamptz not null default now()`).

`content jsonb` holds **the same structured object `prdTemplate.js` consumes**.
Markdown is always derived, never stored, so there is one source of truth. This
is the seam that lets the MCP server and the kanban board be added later without
reshaping anything: an MCP tool result, a database row, and the template input
are all the same object.

`source` (`web` | `mcp`) records provenance. It costs nothing now and is
immediately useful to the kanban work.

| Endpoint | Access |
|---|---|
| `POST /api/prd-save` | Owner only, bearer token vs `PRD_OWNER_KEY` |
| `GET /api/prd-get?slug=` | Public read |

## Limits and quota

Two layers, because neither alone is sufficient:

- **Burst** — the existing `createRateLimiter`. Suggested: 5/min for
  `prd-questions`, 3/min for `prd-draft`.
- **Daily quota** — persistent, via a Supabase `security definer` function
  `increment_prd_quota(ip_hash, day, max_per_day)` that increments **atomically**
  and returns the remaining allowance. Atomicity is required: a separate
  read-then-write lets two concurrent requests both pass.

**Why the existing limiter cannot carry the daily quota.**
`api/_lib/requestGuards.js:10` keeps state in a `Map` on `globalThis`. In a
serverless deployment that is per-instance and resets on cold start, so a daily
cap enforced there is bypassed by waiting for a new instance. It is adequate for
per-minute burst control and is kept for that.

IPs are stored as a **SHA-256 hash of IP plus an env salt**, never in readable
form. There is no reason to retain visitor IPs in order to count an allowance.

The quota function is anon-callable, like `increment_page_view`. The residual
risk is griefing — someone could inflate a counter they guess the hash of — not
bypass, since the server calls it on every request regardless. Accepted: the
salt makes hashes unguessable, and inflating a counter only costs the attacker
their own allowance.

Length caps: description ≤1200 chars, system name ≤80, each answer ≤500, at most
8 answers. Output caps: ~500 `maxTokens` for questions, ~3500 for the draft.
`callSumopodChat` defaults to 800 (`api/_lib/sumopod.js:115`) and takes the value
per call, so the 600 in `readme-assistant.js` is that endpoint's own choice, not
a ceiling. The draft call is the only expensive one in this feature.

### Scope guard

`api/_lib/assistantScope.js` **must not be reused**. Its `SCOPE_RULES` restrict
the assistant to discussing A Wahid Saphadi and explicitly forbid architecture
advice, schemas, migrations and code blocks; its `TECH_ARTIFACT` pattern flags
`endpoint`, `schema`, `crud`, `auth` and `migration` as out of scope. Those are
ordinary vocabulary in a PRD description, so reusing that guard would reject
most legitimate input.

A narrower guard is needed: reuse the existing `INJECTION` regex as-is, reject
input that is plainly not a product specification, and **allow** technical
discussion, which is the point of the feature.

## Failure modes

| Failure | Handling |
|---|---|
| Draft JSON truncated at `maxTokens` | `parseJsonLenient` first, then validate required top-level keys. On failure, return a structured error; the UI offers a retry **without re-running the clarify stage**, since answers stay in client state. Losing the user's answers to a model hiccup is the outcome to avoid. |
| Invalid Mermaid | Light validation only: first line must match `flowchart` / `sequenceDiagram` / `erDiagram`. On mismatch the section renders with a warning marker and a **balanced fence**. Full Mermaid grammar validation would need the Mermaid parser and is out of scope. |
| Quota exhausted | 429 with a clear message and reset time. |
| Model timeout or outage | `callSumopodChat` already has a configurable timeout; surface the error and preserve wizard state. |
| Missing Supabase or owner env vars | Fail with a `CONFIG_MISSING`-style error, matching `pageViews.js`. |

The review page does **not** render Mermaid as images. Rendering needs the
`mermaid` dependency (~1MB) while the main bundle is already ~1.5MB and Vite
warns about chunk size on every build. Given the chosen drawnix integration is
copy-and-paste, an on-page picture does not pay for that weight.

## Testing

Convention: `node:test` with `node:assert/strict`, run by `node --test`, matching
the 13 existing `readmeTemplate` tests and the `fetch`-mocking style of
`api/_lib/pageViews.test.js` (`t.mock.method(global, 'fetch', ...)`).

A `"test": "node --test"` script is added. It is **not** wired into
`npm run check`, so `.husky/pre-commit` keeps running lint and build only —
the user's explicit choice, to avoid slowing every commit.

**`src/lib/prdTemplate.test.js`** — the highest-value suite, because moving the
structural guarantee from the model into code is the entire reason for this
approach:

- all nine headings present and correctly ordered, even with empty input;
- an empty section yields the `[belum terisi]` marker rather than being dropped
  (the deliberate divergence from `readmeTemplate`, so it must be locked in);
- Mermaid line arrays are joined and fenced correctly;
- an invalid Mermaid first line produces a warning marker **and a balanced
  fence**, so the Markdown never breaks;
- database tables and endpoint groups render;
- `assumptions` render as `[asumsi: ...]`.

**`api/_tests/prdAssistant.test.js`**

- `parsePrdQuestions` clamps to eight, drops malformed entries, and tolerates
  fewer than five;
- `parsePrdDraft` turns truncated JSON into a recognizable error rather than
  letting `undefined` propagate;
- sanitizer length caps actually truncate;
- **the new guard admits legitimate technical descriptions** containing
  `endpoint`, `schema`, `auth` while still blocking injection — a direct
  regression test for the `assistantScope` incompatibility above.

**`api/_lib/prdQuota.test.js` / `prdStore.test.js`** — RPC called with the right
arguments; exhausted quota returns the right signal; missing Supabase env yields
`CONFIG_MISSING`; **the service role key is refused when only available under a
`VITE_` name**.

**Not tested, stated openly:** React components. The repo has no jsdom, no
testing-library and no JSX-capable runner; adding one would mean standing up a
frontend test stack well outside this feature. Wizard behaviour is verified
manually in the browser, as with the rest of this repo.

## Assumptions

- `[asumsi]` The `prd-writer` skill structure matches `aw-prd`. Unverifiable
  while that repository is inaccessible.
- `[asumsi]` A full PRD with three diagrams fits in roughly 2500–4000 output
  tokens. If drafts truncate in practice, the response may need to be split
  across two calls, which changes the cost model but not the contracts.
- `[asumsi]` The deployment platform provides `x-forwarded-for`, which
  `getClientIp` already relies on.
