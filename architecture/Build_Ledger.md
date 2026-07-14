---
title: Sturij Marketing — Build Ledger
version: 1.0
updated: 2026-07-14
status: live
tags: marketing, build, ledger, todo, reference
summary: The single to-do list — every spec item vs what's actually live, prioritised. Work it task by task; each task = branch → draft PR → Mark merges.
---

# Sturij Marketing — Build Ledger

The one shared list. Grounded in the **live app** (`/app.html`, checked 14 Jul) + the three sprint specs (2b Today's Run, Phase 3 Image, Support). Work it **task by task**. Governance for every task: **branch → draft PR → you merge · RLS untouched · nothing auto-posts.**

**Status key:** ✅ built & verified · 🟢 built, re-verify · 🟡 partial/legacy · ❌ not built · 🐛 built but broken · 🔒 blocked (needs a decision/key)

---

## 0. Live now — the V1 MVP (context)
This is what people can already see today.

| # | Item | Status |
|---|---|---|
| V1 | Six-tab workspace: **Dashboard · Groups · Plan · Post · DNA · Safety** on live Supabase + Google sign-in | ✅ |
| V2 | Home page → workspace redirect (retired the stale hub) | ✅ (done 14 Jul, PR #7) |
| V3 | Group Ledger image picker (auto-fetch from Wikimedia) | 🟡 legacy — superseded by Phase-3 photo library |

---

## A. Demo-critical bug fixes — do first (small, they make it *look* finished)
From `SPRINT_SPEC_2b` §3d (real live-UAT findings).

| # | Task | Status | Size |
|---|---|---|---|
| **A1** | **Post cockpit: contradictory guard pills + dead-end.** After "Posted ✓" the button silently disables and pills contradict (*"COOLDOWN — 14 DAYS LEFT"* next to *"OK TO POST TODAY"*). Fix → one clear net status (*"Can't post — in cooldown until {date}"*), a success toast, and a path to the next group. | ✅ (PR #9) | **S** |
| **A2** | **Group Detail view** — the drawer already existed on the Groups tab (tier/reach/rules/notes/FB link). Enriched it with the fields that were in the data but hidden — **members/size, posting note, avoid-topics, context, tags** — and added a **View group details** entry point from the **Post** cockpit. | ✅ (PR #10) | M |
| **A3** | **Plan shows live suggestions, not saved plans** — nothing planned persists. Needs `scheduled_posts` (see R4). | 🟡 | M (ties to R-track) |

---

## B. Phase 2b — Today's Run (the daily driver)
`SPRINT_SPEC_2b`. **Depends on 2a** (groups need `url` + rule to run).

| # | Task | Status |
|---|---|---|
| R1 | New **Run** tab; build queue from Plan (greens-first, ≤12/day, rule-days, cooldown excluded) | ❌ |
| R2 | Stepper per group: 3 AI drafts (remix + lock + select), **Post / A-B** toggle, copy-ready | ❌ |
| R3 | **Posted ✓** writes real `posting_log` row + advances; cap blocks at 12; **A/B = one row, counts once** | ❌ |
| R4 | `scheduled_posts` table + workspace accordions: **Posts created** (period filter) & **Scheduled** | ❌ |
| R5 | "Planning only — can't post until {date}" messaging (also resolves A1/A3) | ❌ |

---

## C. Phase 3 — Image Creation
`SPRINT_SPEC_3`. *(A local **Montage Studio v0.1** proves the compose/export UI — it is NOT the governed build; no clearance gate, no shared storage.)*

### 3a — Photo Library
| # | Task | Status |
|---|---|---|
| I1 | Private **Supabase Storage** bucket + `photos` table + RLS (approved emails only) | ✅ (PR #12) — private bucket + photos table + approved-accounts RLS on both |
| I2 | Upload → keep original + generate thumbnail + record dims/bytes; **require ≥1 tag** | ✅ (PR #12) — browser-side thumbnail, ≥1 tag enforced, type/size guarded |
| I3 | **`cleared_for_public` HARD gate** (checklist: no faces/valuables/address/OK-to-show). Uncleared photos unusable anywhere. | ✅ (PR #12) — 4-point human checklist; only a person clears; revoke supported |
| I4 | Maker-vocabulary tagging; `photo_state` chip (raw/retouched/pro, informational) | 🟡 (PR #12) — free-tag vocab + photo_state chip shown; no UI to *change* state yet |
| I5 | Asset page: **latest-10 + most-used** default, search ranked over tags+description, missing-description floats top | ✅ (PR #12) — recent+most-used default, search filter, missing-description floats |
| I6 | `use_count` / **least-used-first** rotation (ban-risk: don't repeat images) | ❌ — column + sort exist; needs the Run/montage to consume images |
| I7 | **Photo groups** (named collections) + "review suggested" when new photos match | ❌ |
| I8 | **Single crop-to-template** export (so images work in the Run before 3b) | ❌ |
| I9 | AI auto-tag + description on upload (Nano Banana/Gemini vision) | 🔒 needs Google key |

### 3b — Montage Builder
| # | Task | Status |
|---|---|---|
| I10 | **`templates` table (data, not hardcoded):** 3×3 sq + 3×3 portrait (primary), 2×2 landscape, single | ❌ |
| I11 | Canvas compose: per-cell **mask + pan/zoom/crop** (never distort), high-res PNG export | ❌ (v0.1 sketch exists) |
| I12 | **Lock cell + tile-swap remix** (headline: remix swaps only unlocked cells) | ❌ |
| I13 | `compositions` table (non-destructive); saved adverts **inherit source tags**, searchable | ❌ |
| I14 | Feed the Run — composition selectable as post image, logs `image_ref` | ❌ |

### 3c — AI image (Nano Banana, governed)
| # | Task | Status |
|---|---|---|
| I15 | Edge Function holding the Google key **server-side** | 🔒 needs Google key |
| I16 | **B1 colour-balance** (harmonise montage tiles — colour/tone only, never alter content) — *recommended* | 🔒 |
| I17 | **B2 brand-graphics** generation (brand/abstract only, never fake projects) — *optional* | 🔒 confirm scope |

---

## D. Support
`SPRINT_SPEC_support`. **Recommended early** — catches feedback across all testing.

| # | Task | Status |
|---|---|---|
| S1 | **Support** tab + `support_tickets` table + RLS | ✅ (PR #11) — table + approved-accounts RLS live; 7th tab |
| S2 | New ticket (bug/feedback/feature/backlog) + list/filter/status chips | ✅ (PR #11) — raise form, status+kind filters, open→in-progress→closed flow |
| S3 | AI **triage** on create (Edge Function classify/summarise/cause) | ❌ — fast-follow, needs `ANTHROPIC_API_KEY` in this project's Edge secrets |
| S4 | **Short report** (`resolution`) on close — reads as a plain-English changelog | ✅ (PR #11) — resolution captured on close, shown on the ticket |
| S5 | **Email** contact@sturij.com on bug open/close (Edge Function + provider) | 🔒 needs email provider + key |
| S6 | AI **draft-fix** PR (later) / **escalate** when it can't | ❌ (later) |

---

## Blockers / decisions needed from Mark
1. **Google / Nano Banana key** → unblocks I9, I15–I17.
2. **`Advert.zip`** (the 40 real montages) → grounds the exact formats for I10/I11.
3. **Email provider + key** (Resend/SendGrid) → unblocks S5.
4. **B2 scope** — brand-graphics generation in or out? (I17)
5. **2a status** — do the 273 groups have `url` + rule captured enough to run? (gates the whole R-track)

---

## Recommended order (fastest value → hardest)
1. **A1** — contradictory pills / post dead-end. *Tiny, demo-critical — do today.*
2. **A2** — Group Detail view. Makes Groups + Post feel complete.
3. **S1–S4** — Support (no AI). Small; starts catching every bug/feedback.
4. **I1–I8** — Phase 3a photo library + clearance + single-image export. The real image foundation (no AI needed).
5. **I10–I14** — Phase 3b montage + remix.
6. **R1–R5** — Today's Run (consumes the images).
7. **AI + email** (I9, I15–17, S5) — once the keys are in.

*Every task ships as its own branch → draft PR → Mark merges. This ledger is the shared record — update the status column as each lands.*
