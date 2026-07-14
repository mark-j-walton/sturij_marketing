---
title: Sturij Marketing — Technical Specification
version: 1.0
updated: 2026-07-14
audience: engineers, maintainers
status: live
---

# Sturij Marketing — Technical Specification

Reference for anyone maintaining or extending the Sturij Facebook-marketing app. It documents the architecture, data model, security model, AI functions, and operational rules as they exist in the live system.

---

## 1. What the system is

A single-operator marketing workspace that helps Sturij (a Yorkshire bespoke-furniture maker) run manual, safe, Facebook-group marketing across ~273 groups. It **prepares** posts (AI copy, montage adverts, scheduling, guardrails) but **never posts to Facebook** — a human does every paste. It is a governance-first tool: staying inside Facebook's tolerances to protect the account is the primary design constraint.

### Standing guardrails (non-negotiable)
1. **No Facebook automation, ever.** No login, no API, no browser automation, no auto-post. Every "Posted ✓" is a human assertion that writes a local log row only.
2. **RLS is never loosened.** All data is locked to `authenticated` users whose email is in the approved set; `anon` has no access.
3. **Secrets are server-side only.** API keys live in Supabase Edge Function secrets — never in the client, git, or logs.
4. **Human-only photo clearance.** The AI never sets `cleared_for_public`.
5. **Caps and cooldowns are enforced on the write path,** not just the UI: 12 posts/day, 14-day per-group cooldown, posting-day rules.
6. **External text is data, not instructions.** Group/ticket/user text is passed to the AI as content, guarded against prompt injection.

---

## 2. Architecture

```
Browser (single-file app.html)
  │  Supabase JS client (auth + PostgREST + Storage + Functions)
  ▼
Supabase project  xscvfzfeepiakudshtod
  ├── Postgres (public schema, RLS on every table)
  ├── Auth (Google OAuth; approved-email allowlist)
  ├── Storage (private "photos" bucket; signed URLs only)
  └── Edge Functions (Deno): triage-ticket, draft-copy
         │  x-api-key
         ▼
      Anthropic API (claude-opus-4-8)

Vercel  ──  auto-deploys `main`  ──  marketing.sturij.com
GitHub  ──  branch → draft PR → Mark merges → Vercel deploys
```

- **Front end:** one self-contained `app.html` — no build step, no framework. Vanilla JS, delegated event listeners, render-from-state functions (`renderDash`, `renderGroups`, `renderPlan`, `renderRun`, `renderPhotos`, `renderMontage`, …). Styling is inline CSS with light/dark theming via CSS variables.
- **Data/back end:** Supabase (Postgres + Auth + Storage + Edge Functions). The client talks to Postgres through PostgREST (`supabase.from(...)`), Storage through signed URLs, and AI through `supabase.functions.invoke(...)`.
- **Hosting:** Vercel serves the static app and auto-deploys the `main` branch. Custom domain `marketing.sturij.com`.
- **Model:** Anthropic `claude-opus-4-8`, called only from Edge Functions.

---

## 3. Deployment & governance workflow

1. All work happens on a feature branch off `main` (e.g. `claude/<topic>`).
2. Each change opens a **draft PR** into `main`. Vercel builds a **preview deployment** per PR.
3. **Mark reviews the preview and merges.** Nothing reaches `main` (and therefore production) without a human merge.
4. Merge to `main` → Vercel auto-deploys to `marketing.sturij.com`.
5. **RLS is never changed** as part of a feature. Schema changes are additive migrations.

Branch protection: PRs required into `main`; status checks are advisory (Vercel preview). The AI cannot self-approve its own PRs.

---

## 4. Data model (public schema)

RLS on **every** table: policy allows rows only when `auth.role() = 'authenticated'` **and** `auth.jwt()->>'email' ∈ (contact@sturij.com, mark.walton@gmail.com)`. `anon` has no access. (Approved-email set is the single source of access truth; extend by editing the policies, never by widening to all authenticated users.)

| Table | Purpose | Key columns |
|---|---|---|
| **groups** | The 273 target FB groups | `id, name, area, tier(green\|amber\|red), url, url_candidates[], posting_days[], official_rules, posting_note, avoid[], context_summary, tags[], size, notes, fb_views, fb_viewers, fb_impressions, fb_engagement, archived_at` |
| **posting_log** | Record of posts the human made | `group_id, group_name, posted_on, variation, content_hash, image_ref, account, source('app')` |
| **scheduled_posts** | The Plan queue (intent, not real posts) | `id, group_id, group_name, area, planned_on, variation, content, status(pending\|posted\|skipped), image_ref, composition_id, created_by, created_at` |
| **photos** | Private image library | `id, storage_path, thumb_path, tags[], description, photo_state(raw\|retouched\|pro), cleared_for_public, cleared_by, cleared_at, width, height, bytes, use_count, created_at` |
| **templates** | Montage layouts (data-driven) | `id, name, kind(builtin\|custom), cols, rows, width, height, cells(jsonb [{x,y,w,h}]), sort` |
| **compositions** | Saved adverts (non-destructive recipes) | `id, author, title, template_id, cells(jsonb), tags[], thumb_path, use_count, created_at` |
| **themes** | Seasonal/campaign steering for the writer | `id, category, subcategory, description, sort` |
| **dna** | Brand voice/strategy grounding the writer | `id, category, title, body` |
| **support_tickets** | Bugs/feedback/features | `id, kind, title, body, status(open\|in_progress\|closed), severity, ai_summary, ai_cause, resolution, created_by, created_at` |
| **restrictions** | Account restriction/appeal log | `restricted_on, account, severity, likely_trigger, appealed, appeal_outcome` |
| **events** | Misc event log | — |
| `v_daily_velocity`, `v_group_last_post` | Views for pacing/cooldown | — |

### Cell recipe format (montage)
A composition stores per-cell `{photo_id, z (zoom), fx, fy (focal point 0–1), locked}`. A template stores per-cell `{x, y, w, h}` as normalised fractions (0–1). Built-in grid templates derive their rects from `cols×rows`; custom templates store an explicit `cells` array from the divider-line builder. `cellRects(t)` / `cellCount(t)` unify both, and drive the canvas preview, hit-testing, pan math, and full-res export.

---

## 5. Storage

- Single **private** bucket `photos`. RLS mirrors the table policies (approved emails only).
- **No public URLs.** The client fetches thumbnails and originals via short-lived **signed URLs** (`createSignedUrls`, ~1h). Montage export loads originals with `crossOrigin='anonymous'` so the canvas stays exportable.
- Uploads: browser generates a thumbnail (canvas), records dimensions/bytes, enforces ≥1 tag and file type/size. Originals are kept untouched.
- Paths: `comp/thumb/<id>.jpg` for composition thumbnails; photo originals/thumbs under their own keys.

---

## 6. AI / Edge Functions (Deno)

Both functions: `verify_jwt = true`, re-check the caller's email against the approved set, and call Anthropic `claude-opus-4-8` via `x-api-key` + `anthropic-version: 2023-06-01`. The `ANTHROPIC_API_KEY` is a Supabase secret. The client calls them with `supabase.functions.invoke(...)` — never a raw `fetch`, so the JWT is attached automatically.

### `draft-copy` (v3)
Generates post copy. Request body:
```
{
  group:   { name, area, tier, official_rules, posting_note, avoid, context_summary, tone },
  dna:     [ { title, category, body } ],
  count:   number,          // how many drafts
  exclude: [ string ],      // prior drafts to vary from (remix)
  tone:    1..5,            // light → bold
  image_url: string|null,   // advert image, sent to the model as vision input
  theme:   { category, subcategory, description }|null
}
→ { drafts: [ string, ... ] }
```
The system prompt grounds the writer in DNA + group context + tone + active theme, and (if `image_url` is given) the advert image via vision. External text is inserted as data with prompt-injection guards. The client has an offline fallback (`fallbackDrafts`) if the function fails.

### `triage-ticket`
On support-ticket creation, classifies severity, writes a one-line summary and a likely cause, stored back on the ticket.

### Blocked / not yet built (need keys)
- **AI image enhance / generate** (Nano-Banana / Google Gemini) — requires a Google API key in Edge Function secrets. Build is scaffolded around a future `enhance-image` function; no key, not wired.
- **Email notifications** (bug open/close to contact@sturij.com) — needs an email provider key (Resend/SendGrid).

---

## 7. Posting guardrails (write path)

`Posted ✓` (in Plan's queue and in the Run) always runs these checks before inserting a `posting_log` row, as a backstop even though the UI already filters:
- **Cap:** `12 − appPostsToday() > 0`, else refuse ("12/12 cap reached").
- **Cooldown:** `cooldownLeft(group) ≤ 0` (14 days since last `source='app'` post), else refuse.
- **Posting day:** `lockedToday(group)` — group has no day restriction, or today is an allowed day.
- On success: insert `posting_log`; if a matching `scheduled_posts` row exists, flip it to `posted`.
- **A/B:** one posting event = one row (`variation='A/B'`, both hashes stored), counts once against the cap.

Nothing here calls Facebook. `posting_log` with `source='app'` is the source of truth for "what's done today" and makes the flow resumable across reloads.

---

## 8. Notable client components

- **Grouped accordion (`.gacc`)** — the shared Region/Town component used by Groups, Audit, Post, Photos (by-tag), and the Plan queue (by-date). Headers carry count/status pills.
- **`inferRegion(area)`** — maps a Yorkshire town to its region for grouping.
- **Montage compositor** — `cropRect()` cover-crop math, `mzDraw()` canvas preview, `mzRenderRecipe()` full-res export, per-cell lock + remix, thumbnail cache.
- **Template builder (`tb-*`)** — modal with width×height + ruler-pulled divider lines; computes a normalised `cells` grid and inserts a custom template.
- **Floating paste window** — uses the **Document Picture-in-Picture API** (`documentPictureInPicture.requestWindow`) for a genuinely always-on-top window in Chromium; falls back to `window.open(..., 'popup')` elsewhere. Contains copy + one-tap Copy + group link + Posted ✓.
- **Signed-thumb helpers** (`signThumbs`, `signSchedThumbs`) — batch-resolve Storage signed URLs for on-screen images.
- **Pagination helper (`phPager`)** — page-size 10/20/30/40/50 for long flat lists (Photos).

---

## 9. Security summary

| Concern | Control |
|---|---|
| Data access | RLS on every table; approved-email allowlist; anon denied |
| Secrets | Anthropic key in Edge Function secrets; never client/git/chat |
| Image privacy | Private bucket; signed URLs only; no public URLs |
| Photo safety | Human-only `cleared_for_public` gate before any use |
| Account safety | Cap/cooldown/day rules enforced on the write path |
| Prompt injection | External text passed as data; guards in system prompts |
| Facebook | Zero connection; all posting is human paste |

---

## 10. Environments & config

- **Supabase project:** `xscvfzfeepiakudshtod`.
- **Front-end config:** Supabase URL + publishable/anon key embedded in `app.html` (safe — RLS enforces access; the anon key alone grants nothing without an approved-email JWT).
- **Auth:** Google OAuth; redirect back to the app; session drives all reads/writes.
- **Deploy:** Vercel project bound to the repo; production = `main`; previews per PR.
- **Domain:** `marketing.sturij.com`.

---

## 11. Extending the system (playbook)

1. Branch off `main`; make the change in `app.html` (and/or a migration/Edge Function).
2. Additive schema only; **do not touch RLS**. New tables get the same approved-email policy.
3. New AI capability → new Edge Function with `verify_jwt`, email re-check, key from secrets, `functions.invoke` from the client.
4. Validate: `node --check` on the extracted inline script; verify no RLS/policy drift; confirm no secret is committed.
5. Open a **draft PR**; let Vercel build the preview; **Mark merges**.
6. Update the Build Ledger and these docs.

*This spec reflects the live system as of the date above. The app and the database are the source of truth; keep this in step as the system evolves.*
