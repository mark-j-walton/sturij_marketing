# Merge Gate — read-only validator for the V1 Workspace sprint

The **anti-hallucination gate**. When the dev pushes its branch + draft PR, this checks the build against
**reality** — the live Supabase DB, the deployed page, the branch/PR — and returns
**SAFE-TO-MERGE / HOLD / DO-NOT-MERGE**, one line per acceptance criterion in
[`../SPRINT_SPEC_V1_workspace.md`](../SPRINT_SPEC_V1_workspace.md) §10. It never checks the dev's *account*
of the work; it checks the work.

It is **strictly read-only**: DB access is GET-only against PostgREST with the public anon key; the deploy
is fetched, not touched; git/PR state is a guided checklist, never a mutation. Requires **Node ≥ 18** (global
`fetch`), zero npm install.

## Run

```bash
# DB-only (works today, before the dev has deployed):
node gate.mjs

# Full: point it at the PR-preview deploy
node gate.mjs --deploy https://<pr-preview>.vercel.app --page /app.html

# If the deploy is auth-walled (it should be), the app HTML can't be scanned
# unauthenticated — pass an accessible copy of the app HTML instead:
node gate.mjs --deploy https://<pr-preview>.vercel.app --html ./app.html

# Machine-readable (exit 0 safe / 1 hold / 2 do-not-merge):
node gate.mjs --deploy https://<pr-preview>.vercel.app --json
```

Flags: `--deploy <url>` `--page <path>` (default `/app.html`) `--html <url|path>`
`--supabase-url` `--anon-key` `--sprint-start YYYY-MM-DD` `--json`.

## What is auto vs guided

| AC | Check | How |
|----|-------|-----|
| 2 | 273 groups, tier mix, spot-checks (exact-named Crossgates=170, Yorkshire Business Network=1) | **auto** (DB) |
| 3 | Boston Spa Grumbler is the only Tue-locked group (Plan's data precondition) | **auto** (DB) |
| 3 | Plan Today ≤ 12, greens first | guided (interactive UI) |
| 4 | "Mark posted" wrote a real `posting_log` row (`source='app'`, has account) | **auto** (DB) |
| 5 | Guardrails *held* — no app-day over cap 12, no app re-post inside 14-day cooldown | **auto** (DB) |
| 5 | Over-cap / in-cooldown post is *blocked* | guided (attempt a 13th, then re-run — `guard` must stay PASS) |
| 6 | DNA persists to the `dna` table | **auto** (DB: table exists + seeded; edit + re-run to prove `updated_at` advances) |
| 1 | No service/secret key in client source | **auto** (scan served HTML) |
| 1 | Page behind auth / Deployment Protection | **auto-ish** (detects the wall; edge protection is confirmed manually) |
| 7 | Chrome markers (rail / topbar / theme toggle / DM+Plex fonts) | **auto** (scan) + human render-confirm |
| 8 | Gate green · `local==remote` · draft PR open · nothing merged | guided (architect-run) |

## Verdict rule

`any FAIL → DO-NOT-MERGE` · else `any HOLD → HOLD (not safe yet)` · else `all PASS → SAFE-TO-MERGE`.
HOLD is deliberately *not* safe: a criterion the gate could not confirm has not passed.

## Baselines

[`baselines.json`](baselines.json) is pinned from the **live DB on 2026-07-10**, not from the spec prose —
that is the point. Two catches already baked in:

- The spec's shorthand "Crossgates=170 / Yorkshire Business Network=1" is ambiguous — 4 "Crossgates" and 5
  "Yorkshire…" groups exist. The gate pins the **exact** names + `fb_views` that are actually 170 / 1.
- The 15-Jun **23-post burst is reconstructed seed** and legitimately exceeds the cap. The cap/cooldown
  invariant is scoped to **app-written rows only** (`source='app'`) so historical seed never fails the gate.

Re-pin only from a real query. Never edit a baseline by hand to make a check pass.

## Target repo / branch

The dev's implementation lives on a branch of the marketing repo (confirm the exact repo + branch + PR-preview
URL when the dev pushes). This gate needs none of that to run the DB checks; pass `--deploy` (and `--html` if
walled) for the deploy checks, and run the §8 repo/PR checks against wherever the dev pushed.
