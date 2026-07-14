# Changelog — Sturij Marketing Platform

A running record of what has shipped to `main` (auto-deploys via Vercel), reading the live Supabase database (`xscvfzfeepiakudshtod`). Newest first. Human posts, human merges — nothing auto-posts.

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
