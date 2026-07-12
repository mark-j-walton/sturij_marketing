# Sprint Spec — Phase 3: Image Creation (photo library + montage builder)

**Role split:** Architect (Claude — spec + validation) → Executor (branch, draft PR) → Human (Mark, merges). Nothing auto-posts.
**Repo:** `mark-j-walton/sturij_marketing` · **DB:** Supabase `xscvfzfeepiakudshtod` · **Deploy:** `marketing.sturij.com`.
**Base:** off latest `main`, e.g. `claude/3-image-creation`. Grounded in the 40-image `Advert.zip` sample set (real Sturij montages).

---

## 0. Standing guardrails

- **Prepare, don't post.** The tool builds the image up to a **download / clipboard**; the human attaches it and posts by hand on Facebook. The app never posts, never auto-fires; no FB automation. (Same rule as the Run.)
- **Client respect, enforced by the tool.** A photo with a client's personal items cannot enter a montage or post until **explicitly cleared** (see the gate). This is a hard gate, not a warning.
- **Storage:** a **private** Supabase Storage bucket (not public). Files reached only through the authenticated app. **RLS on `photos`/`compositions` locked to `authenticated` + email ∈ (`contact@sturij.com`, `mark.walton@gmail.com`); anon has none.** Do not loosen.
- Originals are **immutable**; all edits are **non-destructive** (crop/transform stored as data referencing a `photo_id`, never written back to the file).

## 1. Reference (what "done" looks like)

`Advert.zip` = 40 finished adverts. Two real formats, both aspect-locked:
- **3×3 grid, square/portrait (~1:1 and 4:5)** — the **primary** (`mix_N`, `page0*`). Themed sets (a palette / a category).
- **2×2 grid, landscape (~1.91:1 / 16:9)** — secondary.
- **Remix = swap individual tiles.** `page0 copy 1…20` are *one base montage* with cells swapped — instant variations. **This is the headline feature.**
The tool must reproduce these from **cleared** library photos and export a matching PNG.

## 2. Goal / DoD

Give Polly a **photo library** (upload, tag, clear) and a **montage builder** (2×2 / 3×3, aspect-locked, non-destructive, tile-swap remix) that outputs an FB-ready image to **download** — which the Run then attaches. Done = photos upload to private storage, the clearance gate blocks uncleared use, a montage composes + exports a correct-aspect PNG, remix swaps a tile in one click, and RLS/anon lockdown holds.

---

## 3. Sprint 3a — Photo Library

**3a.1 Upload + file size.** Real project photos → private Storage bucket. On upload: keep the **original** (immutable), **generate a thumbnail** (fast grid browsing), and record **dimensions + byte size**. Compress / cap max dimension for the display copy so the library stays fast and storage stays sane. **Required tags on upload:** the user must set ≥1 tag (AI recommends more); an **AI vision pass writes a short `description`** on upload, editable.

`photos` table:
```
id uuid pk, storage_path text, thumb_path text, bytes int, width int, height int,
title text, tags text[] default '{}', ai_tags text[] default '{}', description text,
photo_state text check (photo_state in ('raw','retouched','pro')) default 'raw',
cleared_for_public boolean default false, clearance_note text,
cleared_by text, cleared_at timestamptz,
job_ref text, use_count int default 0, last_used_on date,
uploaded_by text, created_at timestamptz default now()
```
RLS: authenticated + approved emails only (same pattern as the rest).

**3a.2 Tag** with the maker vocabulary (supplier/finish/door-style/room — shaker, mirror-door, in-frame, painted, kitchen, wardrobe, media unit, loft…). Tags drive montage auto-selection + coherent grouping.

**3a.3 `photo_state`** (raw / retouched / pro) — **informational** (does not block). Shown as a chip.

**3a.4 The `cleared_for_public` gate (hard).**
- Default **closed** (`false`). Uncleared photos are **not selectable** for any montage or post.
- **Clearance = a short checklist + confirm** (any approved user can clear): *no identifiable faces · no client valuables/personal items · no address/number visible · client OK to show.* Ticking all + confirm sets `cleared_for_public=true`, `cleared_by`, `cleared_at`.
- Only **cleared** photos appear in the builder and the Run.

**3a.5 Single-image use.** A cleared photo can be attached to a post directly, with a **basic crop-to-template** (pick aspect 1:1 / 4:5 / 1.91:1, crop, export) — so images work in the Run *before* 3b lands.

**3a.6 Asset page — smart listing, search, AI tag + describe.**
- **Default listing (don't filter-all):** the **latest ~10** photos, then the **most-used** — a fast, relevant landing, not the whole library dumped.
- **Search** over **tags + description**, results ranked by a **relevance score**.
- **AI auto-tag (Nano Banana / Gemini vision):** on upload, suggest tags from the maker vocabulary → **human confirms/edits** (`tags`; raw in `ai_tags`).
- **AI description:** a short `description` per photo, written **on upload**, **editable**. Photos **missing a description float to the top** to prompt a fill (or re-run the summary).
- **AI never clears.** `cleared_for_public` stays human (§3a.4).
- **Times-used** (`use_count`, `last_used_on`) — incremented on the Run's "Posted ✓"; sort **least-used first**; flag over-used shots. *Image repetition is a ban-risk pattern — rotate the pictures.*
- *(Later: natural-language search over embeddings.)*

**3a.7 Groups (named collections).**
- Create a **named group** from a selection — e.g. **"Media Walls"** — for fast image-picking when posting. `photo_groups (id, name, created_by, created_at)` + `photo_group_members (group_id, photo_id)`.
- **Review-suggested:** when **new library photos match a group's tag/description profile** but aren't members, the group shows **"Group review suggested"** — it may be missing relevant new images. User **Edit group** (add them) or **Ignore** (recorded so it doesn't re-nag).
- Groups are an image **source** in the montage builder / Run.

**3a acceptance:** upload writes a `photos` row + file + thumbnail + size/dims, **requires ≥1 tag**, and gets **AI tags + an AI description** (editable); the asset page shows **latest-10 + most-used** by default and **search ranks by relevance over tags + description**; missing-description photos surface at top; uncleared photos can't be selected anywhere; clearing (checklist) flips it; **groups** can be created and flag **"review suggested"** when relevant new photos appear; single crop-to-template exports a correct-aspect PNG; AI never clears; RLS intact.

---

## 4. Sprint 3b — Montage Builder

**4.1 Saved template formats (templates are DATA, not hardcoded).**
A `templates` table lets you **define a layout and save it by name**, then reuse it for endless on-brand variation. A template holds: grid geometry (rows×cols or freeform cells), **aspect**, gutters, background, and an optional **branding overlay** (logo / caption band). Ship these presets to start — all editable + savable:
- **3×3 square (1:1)** & **3×3 portrait (4:5)** — primary (per the zip)
- **2×2 landscape (1.91:1 / 16:9)** — secondary
- **single-image** (kind 'single') — one hero photo with a saved treatment/frame/branding, so one-photo adverts are consistent too

```
templates: id uuid pk, name text, kind text check (kind in ('single','grid2x2','grid3x3','custom')),
           aspect text, layout jsonb,  -- cell geometry, gutters, background, overlay/branding
           created_by text, created_at timestamptz default now()
```
Producing variations = **same saved template, swapped photos** → consistent design, infinite variation.

**4.2 Compose in-browser (Canvas).** Fill cells from **cleared** library photos; each cell **masks** the image to its aspect, and the user **pans / zooms / crops within the mask** to set the **focus + framing** (non-distort — never stretch). Export a high-res **PNG to download**. No server render.

**4.3 Lock + tile-swap remix (headline).**
- **Lock a cell** once its framing is right. **AI remix swaps only the UNLOCKED cells** → keep the good ones, regenerate the rest (from cleared photos by tag/palette). One base montage → many adverts, like `page0 copy N`.
- The user can **go back to any cell to re-crop / re-tweak** at any point.
- **When every cell is locked, the composition can be saved.**

**4.4 Tag-driven selection / coherent grouping.** "Fill from tag `shaker` / `kitchen`" pulls a coherent set; the human curates from there.

**4.4b Build flow — two fill modes.**
- **AI-suggested:** give a **prompt** ("grey shaker kitchens, bright, airy") → AI proposes a fill from **cleared** photos using tags + description + relevance → accept / swap.
- **Manual:** select a template **cell** → **add image** from **upload · library · a group**. (Upload here still requires a tag + gets AI tags/description.)
- Then **remix** (swap tiles), optional **colour-balance** (3c B1), **export**.

`compositions` table (non-destructive):
```
id uuid pk, template_id uuid references templates(id), kind text,
aspect text, cells jsonb,   -- [{photo_id, crop:{x,y,w,h}}...]
title text, tags text[], output_path text,  -- optional cached PNG
ai_generated boolean default false,
created_by text, created_at timestamptz default now()
```

**4.4c Saved compositions inherit tags + a library.** A saved composition **inherits the tags (and text/description) of its source photos**, so the **saved-adverts library is sortable / searchable by tag + text**. When starting a montage, the user picks **New** or an **existing** saved composition to build from.

**4.5 Feed the Run.** A composition (or single cleared photo) is selectable as the image in **Today's Run**; on "Posted ✓", `posting_log.image_ref` = the composition/photo ref. Human downloads the PNG and attaches it in Facebook by hand.

**4.6 Seed / provenance.** `Advert.zip` (the 40 finished adverts) can seed a **"Past adverts"** gallery for reference — but the builder needs the *individual* source photos, not the finished grids. Note the distinction.

**3b acceptance:** a 3×3 and a 2×2 compose from cleared photos with per-cell **mask + crop/focus** and export a correct-aspect PNG (non-distorted); **locking a cell excludes it from remix**; remix regenerates only unlocked cells; **all-locked → composition saves** and **inherits source tags**; the saved-adverts library sorts/searches by tag+text; New-or-existing selectable; uncleared photos never appear; a composition attaches in the Run and logs `image_ref`; RLS intact.

## 4b. Sprint 3c — AI image (Nano Banana / Gemini), governed

**Model:** **Nano Banana** (Gemini 2.5 Flash Image) on **Vertex AI**, project `sturij-app`. Called via a **Vercel serverless function** (`/api`) — never the client. Client → `/api` → Vertex → store in the private bucket.
- **Auth:** the **`vertex-express` service account** — its **JSON key lives in a Vercel env var** (e.g. `GOOGLE_SERVICE_ACCOUNT_JSON`, server-side). The function mints an access token from it (`google-auth-library`) and calls Vertex. **One credential covers both image (3c) and video (3d).** Grant the SA **Vertex AI User** only (least privilege).

Two governed uses:

**B1 — Montage colour-balance (image-to-image) — RECOMMENDED, in-scope.**
When a grid's tiles clash (different white-balance / exposure across real photos), run the **finished montage** through the model to **harmonise colour + tone** for a cohesive look.
- **Hard constraint: colour / exposure / tone ONLY — never alter the furniture or content.** It's a *retouch* of real photos, not fabrication (consistent with your existing `photo_state` raw → retouched → pro).
- Output tagged `ai_generated=true`; keep the pre-balance version too (non-destructive); still passes the on-brand gate.

**B2 — Brand-graphics generation — CONFIRMED scope: brand graphics only.**
Backgrounds, overlays, typographic/brand assets via a **saved governed prompt** that reads the brand rules from **`BRAND.md`** (fonts, palette, logo + clear-space, treatments, do/don'ts) and the **`/brand-graphics/` assets folder** (logo + font files) — so every output stays on-brand and consistent (same pattern as copy grounded in DNA).
- **Authenticity line — "real jobs only" (LOCKED):** must **not** generate imagery that looks like a genuine Sturij project. Allowed: **abstract / brand / graphic / conceptual only.** Everything tagged `ai_generated` + gated.
- **No token duplication:** palette + fonts are defined once (shared with `DESIGN.md`) and *referenced* by `BRAND.md`, never re-typed — no drift.

**Recommendation:** ship **B1 (colour-balance)** — low-risk, fixes a real problem; keep **B2** to brand graphics, never fake projects.

## 4c. Sprint 3d — Reels (video)  *(heaviest slice — its own phase)*

Templates support **Reels** (video, vertical **9:16**).
- **Flow:** user **selects images** + gives a **prompt** → AI produces **3 short video variations** → user **selects one**.
- **Model:** video-gen needs a **video model** (e.g. Google **Veo** / Runway) — **NOT Nano Banana** (image-only). Same pattern: called via a **Vercel serverless function** (`/api`, key server-side), **async job** (video is slow), output stored in the private bucket. → **decision: which video model + key.**
- **Nothing is wasted (as requested):** **all generated videos are saved** so you can review everything produced; **non-selected variations move to an Archive** (not deleted) for later reuse. *Same principle applies to image remixes — archive, don't discard.*
- **Authenticity (real jobs only):** prefer **motion / transitions over real project photos** (safe — animating real work). Any fully AI-generated video is tagged `ai_generated` + passes the gate; never fabricate a fake project.
- **Auth:** the **same Vertex AI service account** as 3c (`vertex-express`, project `sturij-app`) — Veo runs on Vertex, so one credential covers image + video. No extra setup beyond 3c.
- **Cost/complexity note:** video is **large, costly and slow** — expect async generation, storage growth, and per-render cost. Worth its own budget conversation before building.

`renders` table (videos + generated outputs):
```
id uuid pk, kind text check (kind in ('video_reel','image_gen')),
source_photo_ids uuid[], prompt text, storage_path text, aspect text default '9:16',
selected boolean default false, archived boolean default false, ai_generated boolean default true,
created_by text, created_at timestamptz default now()
```

**3d acceptance:** select images + prompt → 3 saved video variations to review; selecting one keeps it, the rest go to the **Archive** (retrievable, not deleted); Reels are 9:16; every render tagged `ai_generated` + gated; RLS/private-bucket intact.

## 5. Governance

- Never push/merge to `main` — branch + draft PR; Mark merges.
- No RLS loosening; storage bucket stays private; clearance gate is non-negotiable.
- Verify: show upload → clear → compose → export → attach-in-Run, all live; confirm anon still has no access.

## 6. Open decisions (defaulted to my leanings — override any)

- **Clearance:** default-closed ✔ · any approved user clears ✔ · **checklist** (not just a toggle) ✔.
- **`photo_state`:** informational only (doesn't block) ✔.
- **3a scope:** includes single-photo crop-to-template so images work before 3b ✔.
- **Primary template:** **3×3** (square + portrait) per the zip; 2×2 landscape secondary ✔.
- **Bucket:** private, app-mediated (no public URLs) ✔.
- **Saved templates:** templates are data (define + save + reuse) ✔; **single-image** template included ✔.
- **AI image (3c) = Nano Banana** via **Vercel serverless function** (key in Vercel env vars). **B1 colour-balance** (retouch real montages, colour/tone only) → **in scope, recommended**. **B2 brand-graphics generation** → **CONFIRMED: brand graphics only, never fake projects**; governed by **`BRAND.md`** + the **`/brand-graphics/`** assets folder (palette/fonts referenced from `DESIGN.md`, not duplicated); all outputs tagged `ai_generated` + gated.

- **Reels/video (3d):** needs a **video model (Veo/Runway — not Nano Banana)** + key; heaviest/most-costly slice → **decide model + budget**. **Archive, don't discard:** all generated images *and* videos are saved; non-selected variations go to a retrievable **Archive** ✔.

## 7. Later / backlog (captured, not scoped)

- **Prompt-template library:** saved, **tagged** prompt templates (a `gen_prompts` table: name, tags, scaffold, rules). The user picks a prompt by requirement and applies it to image creation — the same "templates are data" idea, for prompts. Governed the same way (on-brand rules baked in; outputs tagged + gated). *Deferred to a later phase.*
