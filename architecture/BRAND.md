# BRAND.md — Sturij brand graphics (starter)

**Purpose.** The single source of truth for **outward brand graphics** and the **governed AI-generation prompt** (Nano Banana). Distinct from `DESIGN.md` (which governs the *app UI*). Palette + fonts are **defined once in `DESIGN.md` and referenced here — never re-typed** (no drift).

**Scope (locked).** Brand graphics only — backgrounds, overlays, typographic/brand assets. **Never** AI imagery that looks like a genuine Sturij project ("real jobs only"). Every generated asset is tagged `ai_generated` and passes the clearance gate.

**Assets live in** `/brand-graphics/` (logo files, font files, example graphics).

---

## 1. Fonts  *(source: DESIGN.md tokens · files in /brand-graphics/fonts)*
- **Display:** DM Serif Display
- **Body:** DM Sans
- **Mono / labels:** IBM Plex Mono
- *Ship the actual .woff2/.ttf in `/brand-graphics/fonts` so graphics render with the real faces (a webfont link won't embed into a PNG).*

## 2. Palette  *(reference DESIGN.md — do not duplicate hex here long-term)*
| Role | Token | Value |
|------|-------|-------|
| Paper | `--paper` | `#faf8f2` |
| Ink / navy | `--ink` | `#20384a` |
| Gold accent | `--gold` | `#d4aa58` |
| Dark paper | (dark) | `#14181c` |
- *These mirror DESIGN.md; if it changes, this reads from there. One source.*

## 3. Logo  *(fill in — only you have the rules)*
- Files: `<list the marks in /brand-graphics/logo>`
- Clear-space: `<e.g. min = height of the "S">`
- Minimum size: `<px>`
- On light / on dark variants: `<…>`
- **Never** redraw or recolour the mark.

## 4. Image / treatment rules  *(fill in)*
- Photography = **real Sturij projects only**; montage aesthetic per `Advert.zip`.
- Tone: `<calm / considered / premium-but-warm — refine>`
- Do: `<…>`  ·  Don't: `<…>`

## 5. Governed generation prompt (Nano Banana) — scaffold
> Applied to every brand-graphics generation. Fill the brackets; keep the guardrails verbatim.

```
You are generating a BRAND GRAPHIC for Sturij (fitted furniture maker), NOT a product photo.
STYLE: {calm, premium, {palette: paper #faf8f2 / navy #20384a / gold #d4aa58}, generous space}.
FONTS (if type): DM Serif Display (display), DM Sans (body).
OUTPUT: {aspect}, {purpose: background / overlay / typographic asset}.
HARD RULES:
- Do NOT depict furniture, rooms, or anything that could look like a real Sturij project.
- Abstract / graphic / typographic / conceptual only.
- No text errors; no logos other than the supplied Sturij mark.
- On-brand palette only.
REQUEST: {user prompt}
```
- Save reusable variants (later: the tagged prompt-template library).
- Every output → tagged `ai_generated=true`, stored in the private bucket, passes the clearance gate before use.

## 6. Governance
- Palette/fonts: one source (DESIGN.md). Logo: never redrawn. Real-jobs-only: enforced.
- This file is what the gen-prompt reads — edit it to steer every future brand graphic.
