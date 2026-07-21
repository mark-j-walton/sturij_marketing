# Changelog — Sturij Marketing Platform

A running record of what has shipped to `main` (auto-deploys via Vercel), reading the live Supabase database (`xscvfzfeepiakudshtod`). Newest first. Human posts, human merges — nothing auto-posts.

## Unreleased — 21 Jul 2026 · The next revision (on `develop` / staging only)

Built against the **isolated staging environment** (staging.marketing.sturij.com → Supabase `srezefvaahdiiczakadx`); production and its data are untouched. `main` is branch-protected; everything below lands via reviewed PRs into `develop` and ships to production only when Mark promotes it — after the architect review gate for anything touching real posting.

- **Sprint 0 — rails** (#40): hostname-based environment switch (only marketing.sturij.com talks to prod), STAGING ribbon, consolidated baseline schema in `supabase/migrations/` (the repo previously held 1 of 20 applied migrations), Edge Function sources tracked in `supabase/functions/`.
- **Sprint 1 — guardrails become facts** (#41): the 12/day cap, 14-day cooldown (all history, incl. reconstructed), posting-day rules and Europe/London date validity are enforced by a Postgres trigger + unique index; `log_posted()` makes Posted ✓ transactional; "today" is computed per-call in Europe/London; AI-fallback drafts are visibly badged; empty-copy logging blocked; posting_log fetches date-windowed.
- **Sprint 2 — tester release** (#42): `approved_users` table drives RLS/storage/Edge-Function access (add a tester from Support → no redeploy); staging-only `seed-demo` with Load/Reset demo data; dismissible guide panels with a global toggle (on in staging); floating tester feedback into AI-triaged tickets.
- **Sprint 3 — one composer** (#43): the Post cockpit is the single drafting surface, mounted in Post, in the Run's current step, and from Plan-queue cards; drafted copy persists to `scheduled_posts.content` and is read back everywhere; paste window available from the composer; ~120 lines of divergent Run logic deleted.
- **Sprint 4 — six-tab workspace** (#44): Today (Overview · Plan · Run) · Post · Library · Groups (+ Needs data) · Brand · Safety & Support, with legacy names redirecting; Save advert offers Schedule / Post now / Done; dead-end empty states became buttons; needs-data banner + tier legend; "Add to queue" everywhere.
- **Sprint 5 — trust & learning** (#45): post-performance follow-up ("How did they do?" two days on → updates the group's real reach), "Posting as" capture on the composer (which Facebook account pasted — recorded per log row), save-failure surfacing (tone/copy), session-expiry message, `esc()` hardening, keyboard-accessible accordions + dialog roles.

## v1.0 — 12 Jul 2026 · V1 Workspace live

The full six-tab workspace is on `main` — **Dashboard · Groups · Plan · Post · DNA · Safety** — over the live 273-group ledger.

- **Post cockpit + DNA** (#4) — the guarded write path: live guard pills (posts-left vs the 12/day cap · 14-day per-group cooldown · scheduled-day check), three maker-voice copy variations → copy + open group on Facebook (posting stays human), "Mark posted" writes a real `posting_log` row. Guardrails enforced in code, scoped to `source='app'`. The editable **DNA** table went live.
- **Sprint-1 app shell** (#3) — the workspace rehoused on the real app shell + `DESIGN.md` tokens; Dashboard, Groups, Plan and Safety reading live Supabase (273 groups · tier mix 8/260/5), light + dark.
- **Architecture docs** (#5) — product spec, sprint specs, the read-only Merge-Gate validator, user handbook, and branded print PDFs.

## v0.1 — 10 Jul 2026 · Foundations

- **Marketing hub + Group Ledger + Reach Map** (#2) — five self-contained pages on live Supabase; serving `index.html` ended the Vercel 404. Group Ledger rewired to live reads/writes; Reach Map + governance + knowledge pages, shared icon-rail shell, light + dark.
- **Constitution + roadmap** (#1) — full `CLAUDE.md` and `ROADMAP.md`.

## Next (not yet released)

The composer (photos → montage → tag-grounded copy → safe planner), the membership map (which team account can post to which group), and finishing the metrics ranking. Access hardening: Vercel Deployment Protection so only Polly gets in.

---

*Ground truth is the live DB and this repo — trust code, not prose. Supersede, don't delete.*
