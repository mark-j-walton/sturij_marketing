# Architecture — Sturij Marketing Workspace

Specs, validation and reference docs produced in the **Architect** role. This folder is documentation only — it does not touch the app build.

## Role split
- **Architect** — writes specs + validates builds against reality (the read-only Merge Gate). *These docs.*
- **Executor** — builds on a branch, opens a draft PR.
- **Human (Mark)** — reviews and merges. Nothing merges or deploys without a person.

## Contents

### Master
- **`PRODUCT_SPEC.md`** — the canonical reference. Consolidates every sprint spec into one document (purpose, architecture, data model, guardrails, features, roadmap, validation).

### Sprint specs (`sprints/`)
Build order: V1 → V2 → Support → 2a → 2b → 3a–d.
- `SPRINT_SPEC_V1_workspace.md` — the workspace (built + merged).
- `SPRINT_SPEC_V2_workspace_polish.md` — front door (map, homepage, root route).
- `SPRINT_SPEC_PHASE2_start_using.md` — early phase-2 framing.
- `SPRINT_SPEC_2a_data_readiness.md` — Audit page, bulk URL import, rule capture.
- `SPRINT_SPEC_2b_todays_run.md` — guided posting queue, `scheduled_posts`, tracking tables.
- `SPRINT_SPEC_3_image_creation.md` — photo library → montage → Nano Banana → Reels.
- `SPRINT_SPEC_support.md` — bug/feedback/feature/backlog, AI triage, email notifications.

### Validation (`validator/`)
The anti-hallucination Merge Gate — checks each build against the live DB/deploy, not the executor's account.
- `gate.mjs` — zero-dep Node validator (read-only).
- `baselines.json` — pinned live-DB baselines.
- `README.md` — how to run it.

### Guides & brand
- `USER_HANDBOOK.md` — plain-English guide to using the workspace safely.
- `BRAND.md` — brand rules for AI-generated imagery (brand graphics only).
- `pdf/Handbook_print.html`, `pdf/Spec_print.html` — branded, print-ready (Chrome → Print → Save as PDF, Background graphics on). Logo embedded.
- `DEV_KICKOFF.md` — dev handoff prompt.

> Brand assets live at repo root in `STURIJ_BRAND_ASSETS/`; visual design tokens in root `DESIGN.md`.

## The bedrock guardrails (run through every feature)
1. **Prepare, don't post.** The app never posts to Facebook — the human pastes by hand. "Posted ✓" is a log entry only.
2. **Real jobs only.** AI imagery is brand graphics, never fabricated projects.
3. **Human gates every merge** (also the prompt-injection security boundary).
4. **Data locked.** RLS = authenticated + approved emails only; anon has no access.
