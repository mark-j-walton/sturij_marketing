# Sturij Marketing — Next Revision: Branch Strategy & Sprint Plan

**Date:** 20 July 2026 · **Basis:** UX, Workflow & Code Review (20 Jul 2026)
**Prime directive:** the live MVP at marketing.sturij.com keeps working, untouched, throughout. All new work happens on a development line, deployed to a **staging** environment with a **separate staging database**. Nothing merges to `main` until you approve it.

---

## 1. Branch & environment strategy

### 1.1 Branch model

```
main      ── locked. The live MVP. Only reviewed PRs from release, merged by Mark.
release   ── (optional, can add later) staging → production promotion buffer.
develop   ── integration branch for the next revision. Auto-deploys to staging.
feat/*    ── one branch per sprint story, PR'd into develop.
```

Simple rule: **feature → PR → develop → staging testing → PR → main**. `main` never receives a direct push again — including from Claude sessions.

### 1.2 Locking `main` (do once)

GitHub → `mark-j-walton/sturij_marketing` → Settings → Branches → *Add branch protection rule*:

- Branch name pattern: `main`
- ✔ Require a pull request before merging (1 approval — you)
- ✔ Dismiss stale approvals when new commits are pushed
- ✔ Block force pushes · ✔ Restrict deletions
- ✔ Include administrators (protects against accident, you can still toggle it off in an emergency)

Or via CLI, if you prefer:

```bash
gh api -X PUT repos/mark-j-walton/sturij_marketing/branches/main/protection \
  -f 'required_pull_request_reviews[required_approving_review_count]=1' \
  -F 'enforce_admins=true' -F 'allow_force_pushes=false' -F 'allow_deletions=false' \
  -f 'required_status_checks=null' -f 'restrictions=null'
```

And create the develop branch:

```bash
git checkout main && git pull && git checkout -b develop && git push -u origin develop
```

(Once the GitHub connector is linked to Claude, I can do all of this for you.)

### 1.3 Deployment mapping (Vercel)

- **Production** (marketing.sturij.com) tracks `main` only. ⚠️ *Action:* the most recent deployment on the project was built from branch `claude/advert-balance`, not `main` — this likely explains the stale "() of 12" build seen in your screenshot. In Vercel → Project → Settings → Git, confirm the production branch is `main`, and check Domains so marketing.sturij.com points at the production deployment, not a preview.
- **Staging**: assign a domain (suggest `staging.marketing.sturij.com` or simply use the stable branch alias `sturij-marketing-git-develop-…vercel.app`) to the `develop` branch. Every push to develop gives testers a fresh build automatically.

### 1.4 Two databases, one codebase

Create a **second, free-tier Supabase project** (`sturij-marketing-staging`): same migrations, seeded with demo data, its own Google OAuth app and its own allowlist (you, Polly, testers). Production credentials never appear in the staging build.

Because app.html currently hardcodes the Supabase URL (L766), Sprint 0 introduces a tiny config switch:

```js
const ENV = /staging|vercel\.app|localhost/.test(location.hostname) ? 'staging' : 'prod';
const CFG = {
  prod:    { url:'https://xscvfzfeepiakudshtod.supabase.co', anon:'…' },
  staging: { url:'https://<staging-ref>.supabase.co',        anon:'…' },
}[ENV];
```

This is the single most important safety property of the whole plan: **the test build physically cannot write to production data**, whatever bugs it has. A visible "STAGING" ribbon in the header makes it impossible to confuse the two.

### 1.5 Repo governance notes

- The repository is currently **public**. It contains your brand assets, internal strategy docs and the operator handbook. Nothing in it is dangerous (secrets are server-side; the anon key is public by design), but I'd recommend flipping it to private unless you want it public deliberately.
- `ROADMAP.md` and parts of `architecture/` are pre-database and now materially wrong (e.g. "Database: not implemented"). Sprint 5 includes a docs sweep; until then, treat the Technical Spec as the only current doc.

---

## 2. The sprints

Sized as focused work batches (each ≈ one Claude build session plus your review), sequenced so account safety lands before testers do. Every sprint ends with: deployed to staging, you click through it, PR into develop merged.

### Sprint 0 — Rails and environments *(small, do first)*

**Goal: make it impossible to hurt the MVP.**

- Create `develop`; lock `main` (§1.2); fix Vercel production-branch mapping (§1.3)
- Create staging Supabase project; run existing migrations against it
- Hostname-based config switch + "STAGING" ribbon (§1.4)
- Staging Google OAuth app; allowlist = you + Polly (testers added in Sprint 2)

*Exit test:* push a deliberately broken commit to develop → staging breaks, production untouched; direct push to main is rejected.

### Sprint 1 — Safety hardening *(review P0: C1–C8)*

**Goal: the guardrails become facts in the database, not promises in the browser.**

- Postgres trigger (or insert RPC) on `posting_log` enforcing: ≤12 `source='app'` rows per Europe/London day; ≥14 days since last post to that group **across all sources**; posting-day rule respected. Client keeps its checks for UX; the DB has the final word.
- Unique index `(group_id, posted_on)`; "Posted ✓" buttons disable while in flight
- `TODAY` computed per-call in Europe/London (kills both the UTC bug and the frozen-tab bug)
- AI-fallback drafts visibly badged ("offline template"); logging blocked on empty copy everywhere
- posting_log fetches date-windowed (last 30 days) so Supabase's 1,000-row limit can never silently corrupt the maths
- The `scheduled_posts` flip and `posting_log` insert happen in one RPC (no more stranded pending jobs)

*Exit test:* two browser tabs racing "Posted ✓" produce exactly one row; a tab left open over midnight refuses politely; a 13th post is rejected **by the database**.

### Sprint 2 — Tester release *(your new requirements)*

**Goal: other people can test on real flows against fake data.**

- **Allowlist as data, not code:** new `approved_users` table (email, role: owner/operator/tester, active). RLS policies and the three Edge Functions read it instead of hardcoded arrays. Adding a tester becomes a row insert from a small "Testers" admin panel (visible to you only) — no migration, no redeploy. *(Production keeps its current hardcoded pair until you decide to adopt the table there too.)*
- **Demo data seeder:** a `seed-demo` Edge Function, deployed **only to the staging project**, invoked by a "Load demo data" button (with a companion "Reset demo data"). Seeds: ~40 fictional groups across the five regions with a realistic mix of tiers/links/rules/reach, 15–20 placeholder photos (generated, pre-cleared and uncleared examples), 3 saved adverts, 2 themes, DNA copy, a plausible 3-week posting history (so cooldowns, the cap meter and the dashboard all have something to show), and one restriction record. Reset truncates and re-seeds in one call, so every tester session can start from the same known state.
- **Hero/guide panels** (your idea — and it's a good one, it doubles as tester onboarding): each page gets an optional hero strip at the top — one sentence on what the page is for, the 2–3 step happy path, and a primary action button. One global toggle in the header ("Guide: on/off") plus per-page dismiss; preference remembered per user. **Default ON in staging, OFF in production.** Content lives in a single config object in the code, so editing the copy is trivial. This also becomes the natural home for the data-readiness progress bar ("134/273 groups ready — Fix next →") recommended in the review.
- **Feedback loop:** Support tab gains a "tester feedback" kind; a small floating "Feedback" button appears on every page in staging so testers never hunt for it. (Your existing AI triage already summarises what comes in.)

*Exit test:* a fresh tester Google account signs in to staging, presses "Load demo data", completes a full guided post (draft → paste window → Posted ✓) against fake groups, and files feedback — while production data is bit-for-bit unchanged.

### Sprint 3 — One composer *(review U1, C6, C7 structurally)*

**Goal: one way to draft and log a post, used everywhere.**

- Extract the shared composer: 3 drafts + lock/remix, tone slider, theme picker, image/advert attach, FB-style preview, floating paste window, A/B toggle, non-empty-copy guard, correct `image_ref`/variation logging — the union of the best of Plan/Run/Post
- Plan queue, Run and Post all invoke it; drafted copy persists to `scheduled_posts.content` and is read back wherever the job is reopened
- Delete the three divergent implementations (~450 lines)

*Exit test:* the capability table from the review (§U1) has ✔ in every cell, for every surface.

### Sprint 4 — The six-tab workspace *(review §2.3, U2–U5)*

**Goal: the rail matches the daily loop.**

- **Today** = Dashboard + Plan + Run merged (status header, queue, plan/run modes)
- **Library** = Photos/Adverts/Videos/Montage; "Save advert" offers Schedule / Post now / Done
- **Groups** absorbs Audit as a permanent "needs data" filter + banner; bulk importer promoted to the first-run hero
- **Brand** = DNA + Themes; **Safety & Support** merged
- Every dead-end toast/empty-state becomes a button; terminology sweep (one noun per concept); tier dots get text labels + a legend
- Old tab URLs/ids redirect so Polly's muscle memory survives

*Exit test:* the operator can complete a full day's work without ever being told "go to X tab first" in prose.

### Sprint 5 — Polish, trust & truth *(review P2 + docs)*

- Error surfacing for the nine silent writes; session-expiry message; `esc()` hardening + tier-value constraint
- Accessibility pass (dialog roles, focus traps, Escape everywhere, keyboard-reachable accordions); mobile bottom-bar fix (largely solved by six tabs)
- Per-account velocity: composer asks/records **which Facebook account pasted**; cap logic becomes per-account-aware
- Post-performance capture: 48h "how did it do?" prompt writing back to the group's reach fields
- Docs refresh (handbook + tech spec match reality: enhance-image is live, Videos exists, ROADMAP.md updated); `events` table decision; SECURITY DEFINER views fixed or dropped; Edge Function CORS pinned to your domains
- **Release:** promote develop → main via PR, your approval, production deploy. Staging then becomes the permanent home for the *next* cycle.

---

## 3. What I need from you

1. **GitHub connector** — connect it in Claude (Settings → Connectors) and authorise `sturij_marketing`; then I can create the branches, protection rule and Sprint 0 PR directly. Failing that, run the four commands in §1.2 and I'll work via patches you apply.
2. **Staging Supabase project** — say the word and I can create it from here (it needs your confirmation of the free-tier cost of £0 via the Supabase connector), then run the migrations and build the seeder against it.
3. **Decisions parked, not forgotten:** making the repo private; whether production also adopts the `approved_users` table in Sprint 5; whether `release` buffer branch is wanted or develop→main is enough.

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Staging build accidentally pointed at prod DB | Hostname-based config + different OAuth app + "STAGING" ribbon; prod anon key absent from staging bundle is verifiable in the PR diff |
| Big-bang IA change disorients Polly | Sprints 3–4 land on staging first; guide panels default-on; old tab ids redirect; she UATs before promote |
| Testers see each other's changes (shared workspace) | Accepted by design for this round; "Reset demo data" restores baseline; per-tester sandboxes remain a known later option |
| Sprint 1 trigger rejects a legitimate post | Trigger returns a human-readable reason surfaced as a toast; you can disable the trigger with one SQL statement without redeploying |
| main lock blocks an emergency hotfix | Protection allows you (admin) to temporarily untick "include administrators" — documented in §1.2 |
