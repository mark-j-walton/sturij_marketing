# Sprint Spec — Sturij Marketing V1 Workspace (deploy)

**Role split:** Architect (Claude, this spec + validation) → Dev (the AI you hand this to, builds on a
branch) → Human (Mark, merges via `/approve-sprint`; Vercel deploys `main`). One owner per repo = the
dev. Nothing auto-posts. Human posts, human merges.

**Repo:** `mark-j-walton/sturij_marketing` · **DB:** Supabase `xscvfzfeepiakudshtod` (sturij-marketing).
**Base:** branch off latest `main` (`a8a0e32`), e.g. `claude/marketing-v1-workspace`.

---

## 1. Goal / Definition of Done

One **deployed, authenticated workspace page** that Polly uses daily, wired to the **live Supabase DB**:
see the ranked groups, plan the day/week *safely*, post one-by-one (by hand), and read/edit the Sturij
DNA. It replaces the standalone `group_ledger.html` as the primary tool (keep the old pages for now).

**Done =** loads behind auth · reads the 273 live groups with real tiers/reach · Plan respects the safe
cap + rules · "Mark posted" writes a real `posting_log` row · DNA renders/edits/downloads · matches the
existing site chrome · the repo's gate (build/lint) is green.

## 2. Read these first (don't reinvent)

- **Behaviour + look to match:** the working preview → https://claude.ai/code/artifact/0567eaac-7861-46f6-a2f7-3b423b9f17dd
  (tabs: Dashboard · Groups · Plan[Today/Week] · Post · DNA · Safety). Port this, swap embedded data for live reads.
- **Site chrome to match:** `index.html` (navy icon rail + gradient topbar + top-right theme switcher) and
  `group_ledger.html` — **reuse its exact Supabase client (URL + anon key + `@supabase/supabase-js@2` CDN + camelCase↔snake_case mapping).** Do not invent a new client.
- **Copy grounding:** `STURIJ_CONTENT_VOCABULARY.md` (suppliers/finishes/door-styles) — the post-writer uses this so copy reads like a maker, not a brochure.
- **Voice/tone:** the DNA docs (see §6).

## 3. Data model (already live — do NOT recreate)

`groups` (273 rows): existing columns **+ this session's** `fb_views, fb_viewers, fb_impressions,
fb_engagement, fb_measured_at, fb_source`. Tiers already data-driven on 26 measured groups.
`restrictions` (3 rows, Polly personal): `restricted_on, severity, appealed, appeal_outcome, account, likely_trigger, notes`.
`posting_log`: `group_id, group_name, posted_on, variation, content_hash, campaign, image_ref, source, account`.
Views: `v_daily_velocity` (burst detector), `v_group_last_post` (cooldown).
**New this sprint:** a `dna` table (see §6) so DNA edits persist without a redeploy.

## 4. Sections to build (all in one page/SPA)

1. **Auth gate (Option 1).** anon/publishable key in client (public-safe); the moat is **Vercel Deployment
   Protection** at the edge. In-app sign-in captures **who is posting** (Polly / team member name) → used
   as `posting_log.account` for per-account velocity. (Email allow-list is a later graduation.)
2. **Dashboard.** Live counts (273 groups, N measured, tier mix), top-reach leaders, and a **ban-risk
   banner** reading `v_daily_velocity` (flag any day ≥ cap; show days-since-last-restriction).
3. **Groups (Ledger).** Live read of all groups; search + tier filter; real views/impressions; tier chips.
   Click a row → opens **Group Detail** (all fields: size, rules, posting_days, notes, reach history) →
   **Post**. Tier is editable (writes `groups.tier`).
4. **Plan — Today + This week toggle.** Rule-aware: rule-locked groups only on their days (Boston Spa
   Grumbler = Tue); the rest greens-first under the **daily cap**, staggered, variation A/B/C rotated.
   Week view = 7-day grid, weekends rest. **Cap must be computed live** from `posting_log` (today's count).
5. **Post (cockpit).** Group header + day-guard + **3 variations grounded in the vocabulary** → copy to
   clipboard → open the group's Facebook page in a new tab → **"Mark posted" INSERTS a `posting_log` row**
   (group_id, posted_on=today, variation, account, source='app'). Block if over cap or inside the group's
   14-day cooldown (read `v_group_last_post`).
6. **DNA.** Editable, collapsible accordions grouped **Voice&Personality / Strategy / Learning / Reference**
   (Discovery excluded). Each downloadable (.md) + "download all". **Edits SAVE to the `dna` table.** These
   are the tone context the copy engine reads.
7. **Safety.** Restriction log, velocity chart (the 15 Jun 23-burst), the enforced limits, team-spread rules.

## 5. Guardrail enforcement (non-negotiable — this is the point)

- **Cap = 12 posts/day**, **14-day per-group cooldown**, **no identical variation to neighbouring groups**,
  **human posts only** (never auto-post; FB blocks the Groups API anyway).
- The Post flow must **read live counts and refuse** to exceed the cap or violate a cooldown — the guard is
  code, not a hint. Surface remaining/day and cooldown status in the UI.

## 6. DNA storage (new table + seed)

Create `dna (id uuid pk, category text, title text, slug text unique, tone boolean, body text,
updated_at timestamptz default now())`, proving-ground RLS (anon full access, same as the other tables).
Seed from the reference docs (the dna/, strategy/, learning/, reference/ markdown — **skip discovery**).
App reads/writes `dna`. Also commit the source .md files to a `/dna` folder for provenance + download.

## 7. Design / chrome — follow DESIGN.md + the live reference (don't improvise; there's a full system)

The repo already has a **complete** design system — use it, don't reinvent:
- **`DESIGN.md`** — tokens (palette hex+RGB), full type scale, component specs (buttons/inputs/cards/chips
  with real CSS), shadows, motion, dark-mode tokens, icon-rail + topbar layout, do/don'ts.
- **Reference implementation to copy the chrome from verbatim:** `index.html` — the `:root` CSS variables,
  the navy **76px icon rail** (`.rail`), the **gradient topbar** (`.topbar`), the graph-paper `.main`
  background, and the fixed **top-right `.theme-toggle`** (light+dark). Also `group_ledger.html` (Supabase
  client) and `polly_debrief_form.html` (the working design reference).
- **Fonts:** the real Google Fonts link used in `index.html` (DM Serif Display / DM Sans / IBM Plex Mono).
  **Logos:** the real files in `STURIJ_BRAND_ASSETS/` — never redraw the mark.

Two rules to avoid getting it wrong:
- **Where DESIGN.md and `index.html` drift, `index.html` wins** (it's the live values — e.g. dark paper is
  `#14181c` in the implemented tokens, not DESIGN.md's `#1f1c18`).
- **The V1 artifact preview is the *behaviour/layout* reference ONLY — not the styling.** It uses simplified
  fallback fonts/palette because Claude artifacts can't load webfonts or the real assets. The deployed build
  must wear the **DESIGN.md skin over the `index.html` chrome**, not the preview's look.

Responsive; the week grid scrolls sideways on mobile. Link the new page from `index.html`.

## 8. Constraints / governance (from CLAUDE.md + WORKING_MODEL)

- Never push/merge to `main` — dev pushes a branch, opens a **draft PR**; Mark merges via `/approve-sprint`.
- Never fabricate URLs or metrics. Real data only.
- Verify before claiming done: `local HEAD == remote`, gate green, and **show it working** (screenshot the
  authed page reading live rows).
- Re-ground first: list all branches + open PRs before building.

## 9. Out of scope (explicitly — next sprints)

- **Image system** (upload · montage generator · tagging · `cleared_for_public` gate). Spec exists separately.
- **Membership map** (group ↔ which team account can post).
- **Automated metrics capture** (screenshot/DOM). For now metrics load is manual (architect transcribes).

## 10. Acceptance criteria (how the Architect will validate — against reality, not prose)

1. Page loads only behind auth; anon key is publishable-safe (no service key in client).
2. Reads **273 live groups**; tiers + reach match the DB (spot-check Crossgates=170, Yorkshire Business Network=1).
3. Plan Today ≤ 12, greens first; **Boston Spa Grumbler appears only on Tuesdays**.
4. "Mark posted" creates a **real `posting_log` row** (verify via SQL) with the signed-in account.
5. Over-cap / in-cooldown posting is **blocked** (verify by attempting a 13th).
6. DNA edit **persists** to `dna` (verify via SQL) and download returns the edited text.
7. Chrome + design system match `index.html` (verified by rendering, not grep).
8. Repo gate green; `local == remote`; draft PR open; nothing merged.

## 11. Open decisions (flag to Mark before/while building)

- **Page route/name:** `app.html` (recommend) vs folding into `index.html`.
- **DNA store:** `dna` table (recommended, edits persist) vs repo-files-only (edits need redeploy).
- **Account list:** hardcode the 4 team names for the sign-in picker, or free-text for now.
