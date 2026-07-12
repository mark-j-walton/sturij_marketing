# Sturij Marketing Workspace — Product Specification (master)

*The canonical reference. Consolidates the sprint specs (V1 · V2 · 2a · 2b · 3a–d · Support) into one document: purpose, architecture, data model, guardrails, features, roadmap, validation.*

**Repo:** `mark-j-walton/sturij_marketing` · **DB/Storage:** Supabase `xscvfzfeepiakudshtod` · **Host:** Vercel → `marketing.sturij.com`

---

## 1. Purpose

A **safe, authenticated workspace** for Sturij (Yorkshire fitted-furniture maker) to market to local Facebook groups **without triggering account restrictions**. It ranks groups by reach, plans a safe posting schedule, prepares on-brand copy and imagery, and keeps the record — while **the human does every actual post by hand**.

## 2. Roles & governance

- **Architect (Claude)** — writes specs + validates builds against reality (the read-only merge gate).
- **Executor (a dev AI)** — builds on a branch, opens a **draft PR**.
- **Human (Mark)** — reviews and **merges**. Nothing merges or deploys without a person.

**Bedrock guardrails (run through every feature):**
1. **Prepare, don't post.** AI may do anything up to the clipboard (draft copy, build images/reels, assemble runs). The **physical paste into Facebook is the human handover.** The app never posts, never auto-fires, never automates Facebook. "Mark posted / Posted ✓" is a **log entry only**.
2. **Real jobs only.** Marketing shows genuine Sturij work. AI imagery is **brand graphics only** — never fabricated "projects".
3. **Human gates every merge** (also a security boundary against prompt-injection via user-submitted content).
4. **Data locked.** RLS = `authenticated` + approved emails only; anon has no access.

## 3. Architecture

- **Front end:** single-file static SPA(s) on Vercel — the app shell + `DESIGN.md` tokens (icon rail, gradient topbar, theme toggle, light+dark). Reuses one Supabase client across pages.
- **Auth:** Google OAuth (Supabase Auth). App-level allow-list (`contact@sturij.com`, `mark.walton@gmail.com`) **and** database RLS restricted to those emails. `redirectTo = location.origin + location.pathname` (works on any domain if whitelisted in Supabase URL config).
- **Data + storage:** Supabase Postgres (RLS-locked) + a **private** Storage bucket for photos/renders.
- **AI/email backends:** **Vercel serverless functions** (`/api`) — *chosen for consistency: same host as the front end and the keys.* Handle Nano Banana (Gemini image), a video model (Reels), an email provider (Support). **Vercel env vars (server-side, never in client):** the model/email API keys **+ the Supabase service-role key** (so a function can write results into the private Storage bucket / DB). Client → `/api` → model → store.
- **Access model:** anon/publishable key is public-safe; the moat is **RLS + Google auth**. (Vercel Deployment Protection optional; the £150 password add-on is *not* used — Google auth + RLS is the front door.)

## 4. Data model

**Live today:**
- `groups` (273) — name, size, area, url, tier(green/amber/red), avoid[], tags[], notes, responses, confirmed, is_key, image, image_candidates[], context_summary, tone, official_rules, rules_updated, posting_days[], posting_note, fb_views/viewers/impressions/engagement/measured_at/source, timestamps.
- `posting_log` — group_id, group_name, posted_on, variation, content_hash, campaign, image_ref, source, account.
- `restrictions` (3) — restricted_on, severity, duration_days, likely_trigger, appealed, appeal_outcome, notes, account.
- `events`, plus views `v_daily_velocity`, `v_group_last_post`.
- `dna` — category, title, slug, tone, body, updated_at.

**New (by sprint):**
- `scheduled_posts` — persisted plan (group, planned_on, variation, content, status pending/posted/skipped).
- `photos` — storage_path, thumb_path, bytes, width, height, tags[], ai_tags[], description, photo_state(raw/retouched/pro), cleared_for_public, clearance_note, cleared_by/at, job_ref, use_count, last_used_on.
- `photo_groups` + `photo_group_members` — named collections ("Media Walls") + membership.
- `templates` — saved layouts (kind single/2x2/3x3/custom, aspect, layout jsonb).
- `compositions` — template_id, kind, aspect, cells jsonb (photo_id+crop), tags[], output_path, ai_generated.
- `renders` — video reels + generated images (source_photo_ids[], prompt, aspect, selected, archived, ai_generated).
- `support_tickets` — kind(bug/feedback/feature/backlog), status(reported/open/closed), resolution, ai_triage, ai_fix_ref, escalated, reporter.
- `activity_log` *(recommended, cross-cutting)* — append-only: actor · action · target · before→after · timestamp. Feeds the future AI insight chat (reporting layer).

All new tables: RLS `authenticated` + the two approved emails; anon none.

## 5. Guardrails (enforced in code)

- **Cap 12 posts/day**, **14-day per-group cooldown**, **rule-locked groups only on their day**, **vary content**, **human posts only**.
- The Post/Run flow **reads live counts and refuses** to breach them; where blocked, it shows the **net reason + earliest date** ("in cooldown until 21 Jul"), never a silent dead button.
- Cap/cooldown scope to **`source='app'`** rows (reconstructed seed history is exempt but shown for context).

## 6. Features (by area)

- **Dashboard + tracking** — live counts, tier mix, top reach, ban-risk banner. Two collapsible tables: **Posts created** (last-30 default; week/month/custom) and **Scheduled posts** (persist until posted).
- **Groups** — all 273; search/filter by tier; **row → Group Detail** (rules, reach, posting days, notes, FB link).
- **Plan** — safe suggestions (greens-first, under cap, rule-aware). Becomes *real saved plans* via `scheduled_posts`.
- **Post / Today's Run** — pick a group → 3 AI-drafted variations (remix + pick 1 of 3, or **A/B** = pick 2) → Copy → Open group → **Mark posted** logs it. The **Run** is a guided one-at-a-time queue built from the Plan, with a **simulated Facebook preview** and editable copy up to save.
- **DNA** — voice/strategy/learning/reference; editable; grounds the copy.
- **Safety** — restriction log, velocity chart, enforced limits.
- **Audit** — self-emptying data-completeness worklist (per group, only missing fields; 🔴 no URL / 🟠 no rule / 🟢 complete→hidden). Bulk URL import + inline rule capture.
- **Images (3a–d)** — private photo library (upload, thumbnails, tags, **AI auto-tag + description**, times-used, **`cleared_for_public` gate**); montage builder (saved **templates as data**, 2×2/3×3, mask+crop, **lock-and-remix**, non-destructive, export PNG); **Nano Banana** (colour-balance real montages; brand-graphics generation governed by `BRAND.md`); **Reels/video** (3 variations → pick 1, non-selected to Archive).
- **Support** — bug/feedback/feature/backlog; status reported→open→closed with a short report; **email to contact@** on bug open+close; AI triage always-on; AI-drafted fixes **human-gated**; escalation for what AI can't fix.

## 7. Roadmap (build order)

1. **V2 — Front door** (map + flat basemap · homepage · root→workspace route) — *do first*.
2. **Support** — *early, to capture test feedback*.
3. **2a — Data readiness** (Audit · bulk URL · rule capture).
4. **2b — Today's Run** (guided queue · scheduled_posts · tracking tables · UAT fixes).
5. **3a→3b→3c→3d — Images** (library → montage → Nano Banana → Reels).
*Cross-cutting from day one: `activity_log`.*

## 8. Validation (the anti-hallucination gate)

Each build is checked **against reality** — live DB, deploy, repo — not the executor's account of it. Acceptance criteria are DB/deploy-checkable (e.g. a real `source='app'` row appears; a 13th post is refused; anon has no access). Verdict: SAFE-TO-MERGE / HOLD / DO-NOT-MERGE. *(The gate script reads the DB; since anon is now locked, it uses an authenticated/service read.)*

**Proven so far:** V1 workspace built + merged; write-path verified (real app posts logged, tagged to the signed-in account); cap/cooldown enforcement observed live.

## 9. Open decisions

- Email provider (Resend/…) + key · video model (Veo/Runway/…) + key · **budget** — all being provisioned in Vercel.
- Whether to add the cross-cutting `activity_log` now (recommended).
- Root route: rewrite `/`→`/app.html` (a `vercel.json`), or keep the hub and link to the workspace.

## 10. Reference documents

`SPRINT_SPEC_V1_workspace.md` · `V2_workspace_polish` · `2a_data_readiness` · `2b_todays_run` · `3_image_creation` · `support` · `BRAND.md` · `USER_HANDBOOK.md` · the Merge Gate validator · the Brain Knowledge-Layer doc.
