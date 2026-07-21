# The next revision — what changed and why (develop / staging)

*Written 21 Jul 2026. Companion to `architecture/sprints/2026-07-20_UX_WORKFLOW_CODE_REVIEW.md` (the findings) and `2026-07-20_SPRINT_PLAN.md` (the plan). This is the "what actually shipped" record. Everything here lives on `develop` and staging only until Mark promotes it — posting-workflow changes additionally pass the architect review gate (CLAUDE.md rule 14) before touching production.*

## The one-paragraph version

The MVP's story — "the app prepares, you post, and it's impossible to post unsafely" — is now true end to end **on staging**. The safety rules moved from browser JavaScript into the database, where two tabs, a double-click or an overnight session can't dodge them. Three divergent posting flows became one composer. Twelve tabs became six areas shaped around Polly's daily loop, with a guide strip on every page. And the workspace is testable by other people against fictional data that cannot touch production.

## Environments

| | Production | Staging |
|---|---|---|
| URL | marketing.sturij.com | staging.marketing.sturij.com |
| Branch | `main` (protected; human merges only) | `develop` (auto-deploys) |
| Supabase | `xscvfzfeepiakudshtod` | `srezefvaahdiiczakadx` (isolated; demo data only) |
| Chooser | `APP_ENV` in app.html — by hostname; a test build physically cannot reach prod data | amber STAGING ribbon |

## What the database now enforces (Sprint 1)

`posting_log` inserts with `source='app'` pass a trigger or they don't happen: posted_on must be today in Europe/London; ≤12 app posts per London day; ≥14 days since the group's last post **counting all history** (reconstructed rows included); the group's posting-day rule respected; one app post per group per day (unique index). `log_posted()` does the log + queue-flip + advert-use-count as one transaction, with the date set server-side. The client keeps friendly pre-checks, but the database has the last word — refusals arrive as plain-English messages.

## Access (Sprint 2)

`approved_users` (owner / operator / tester, active flag) drives every RLS policy, the storage bucket, and all Edge Functions. Owners manage it from Support → Testers & access. The old hardcoded pair remains only as a fallback for environments without the table (i.e. production until adoption). Demo data: `seed-demo` (staging-only, hard-refuses elsewhere) loads/resets ~40 fictional Yorkshire groups, placeholder photos, adverts, themes, demo DNA, a five-week history with two groups deliberately in cooldown, and a queue.

## One composer (Sprint 3)

The Post cockpit is the only drafting surface. It mounts in the Post tab, inside the Run's current step, and opens from Plan-queue cards. Everywhere: 3 AI drafts with lock/remix, tone slider, theme picker, image/advert attach (vision-grounded drafting), A/B, Facebook-style preview, floating paste window, empty-copy guard, transactional Posted ✓. Drafted copy persists to `scheduled_posts.content` and is read back wherever the job is next opened.

## Six areas (Sprint 4)

Today (Overview · Plan the queue · Work the queue) · Post · Library (Media library · Make an advert) · Groups (All groups · Needs data) · Brand (Voice · Themes) · Safety & Support. Legacy panel names still resolve, so old links and habits keep working. Save advert offers Schedule / Post now / Done. Guide strips (global toggle, per-page dismiss, on-by-default in staging) explain each page; the Dashboard strip carries the data-readiness count.

## Learning loop & trust (Sprint 5)

Two days after an app post, the Overview asks "How did it do?" — the answer is stored on the posting_log row and refreshes the group's real reach (`fb_views`, `fb_engagement`, `fb_measured_at`, source `post follow-up`), so tiers can be steered by evidence. The composer records **which Facebook account pasted** (`Posting as`, remembered locally, written to `posting_log.account`). Save failures (tone, copy) are surfaced instead of swallowed; an expired session says so; accordions are keyboard-operable; drawers carry dialog semantics; `esc()` also escapes single quotes.

## Release-day checklist (when Mark promotes develop → main)

1. Architect review gate on the posting workflow (CLAUDE.md rule 14) + Mark's approval.
2. Apply to **production** Supabase, in order: `20260721001000_posting_guardrails`, `20260721010000_approved_users`, `20260721013000_bucket_allow_svg` (harmless), `20260721030000_post_performance`. (The baseline migration is staging-bootstrap only — prod already has the schema.)
3. Redeploy the three Edge Functions to prod from `supabase/functions/` (approved_users-aware; falls back safely).
4. **Do NOT deploy `seed-demo` to prod** (it also self-refuses).
5. Merge develop → main via PR; verify marketing.sturij.com serves the new build and still points at prod Supabase (no ribbon).
6. Verify guardrails live: try a 13th post / double-click on prod data — expect polite refusals.

## Known deferrals (deliberate, not forgotten)

- Edge Function CORS stays `*` for now (Vercel preview URLs vary); pin to sturij.com domains once preview-testing settles.
- `events` table (0 rows): wire up as an audit trail or drop — Mark's call.
- Per-account posting caps: the app now *records* which account pasted; whether the 12/day cap should split per account is a workflow decision for after tester feedback.
- Per-tester isolated sandboxes: shared workspace chosen for this round; multi-tenancy remains a known later option.
- `docs/TECHNICAL_SPEC.md` + `USER_HANDBOOK.md` describe the **production** build and remain accurate for it; they get their full rewrite when this revision ships to prod.
