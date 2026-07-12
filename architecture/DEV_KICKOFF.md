# Dev Kickoff — Sprint "V1 Workspace"

Hand this to the dev session **together with** [`SPRINT_SPEC_V1_workspace.md`](./SPRINT_SPEC_V1_workspace.md). The architect (Claude) will validate the result against the live DB with the read-only gate in [`validator/`](./validator/) — build to the spec exactly, don't fake anything.

> ✅ **Repo confirmed: `mark-j-walton/sturij_marketing`.** An earlier `trade_qwen` mention was a *different* repo (different remote + root commit) and is ruled out. Build here.

---

**You are the dev on the Sturij marketing platform (`mark-j-walton/sturij_marketing`). Build Sprint: "V1 Workspace" per the attached `SPRINT_SPEC_V1_workspace.md`. An architect wrote that spec and will validate your work against the live database — so build to it exactly and don't fake anything.**

**Before you write a line — re-ground (this repo has been burned by collisions):**
1. Read `CLAUDE.md` and `WORKING_MODEL.md` and follow them. Read `DESIGN.md`.
2. List **all** branches **and** open PRs (not just `main`). Confirm nothing collides. Note the real `main` HEAD.
3. Create ONE work branch off latest `main`: `git fetch origin main && git checkout -b claude/marketing-v1-workspace origin/main`.

**Read these first, reuse — don't reinvent:**
- `SPRINT_SPEC_V1_workspace.md` — the full brief (sections, data model, guardrails, acceptance criteria).
- `index.html` — **copy the chrome verbatim**: navy 76px icon rail, gradient topbar, top-right theme toggle, the `:root` tokens, real Google Fonts, real logos in `STURIJ_BRAND_ASSETS/`.
- `group_ledger.html` — **reuse its exact Supabase client** (URL + anon key + `@supabase/supabase-js@2` + the camelCase↔snake_case mapping). Do not invent a new client.
- `DESIGN.md` §6 for component CSS. Where DESIGN.md and `index.html` drift, **`index.html` wins**.

**Data (Supabase `xscvfzfeepiakudshtod`) — already live, do NOT recreate:** `groups` (+ `fb_views/fb_viewers/fb_impressions/fb_engagement/fb_measured_at/fb_source`), `restrictions`, `posting_log`, views `v_daily_velocity` + `v_group_last_post`. **Create** the new `dna` table (spec §6) with proving-ground anon RLS and seed it from the DNA docs.

**The point of this sprint is the *write-paths and guardrails* the preview fakes:** "Mark posted" must INSERT a real `posting_log` row; tier edits and DNA edits must persist; and the **12/day cap + 14-day per-group cooldown must be enforced in code** (block the 13th post; block a group in cooldown) — read live counts, don't hint. Human posts only; nothing auto-posts.

**Non-negotiables:** never push or merge to `main` — push your branch and open a **DRAFT PR**; Mark merges via `/approve-sprint`. Never fabricate URLs or metrics. Verify before claiming done: `local HEAD == remote`, the repo gate is green, and **show it working** (screenshot the authed page reading live rows; show a real `posting_log` row appearing after a test post).

**When done,** report point-by-point against the spec's **§10 Acceptance Criteria** so the architect can validate each against the DB. Flag the §11 open decisions (page route, DNA store, account list) — pick sensible defaults and say what you chose.

---

## How the architect will check your work

The gate in [`validator/`](./validator/) runs read-only against the live DB and your deploy. To pass, your build must reproduce **real** ground truth, e.g.:

- `groups` reads **273** rows; tier mix **8 green / 260 amber / 5 red**.
- Spot-checks by **exact name**: `Crossgates (Leeds West Yorkshire) Businesses & Services` → `fb_views 170`; `Yorkshire Business Network` → `fb_views 1`. (There are 4 "Crossgates" and 5 "Yorkshire…" groups — read the right row.)
- `Boston Spa Grumbler` is the **only** Tuesday-locked group.
- A "Mark posted" writes a `posting_log` row with `source='app'` **and** the signed-in `account`.
- Cap/cooldown **held**: no `source='app'` day over 12, no app re-post inside 14 days. (The reconstructed 15-Jun 23-burst seed is exempt — don't let it, or your code, breach the cap for real rows.)
- `dna` table exists, is seeded, and edits persist (`updated_at` advances).

Green gate → Mark runs `/approve-sprint`.
