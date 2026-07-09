STURIJ MARKETING — Brand Identity & Design System
**Comprehensive guide for marketing integration & brand communication**

---

## 1. Brand Overview

**Sturij** is an AI-powered visualisation system for tradespeople — specifically built for fitted and freestanding wardrobes, kitchens, and built-in furniture. The brand voice is direct, fearless, and grounded in the material world.

**Core Principle:** *Texting, not software.* Tradespeople communicate with the system the way they'd text a mate — simple answers to simple questions — while invisible machinery (geometry, pricing, compliance) handles the complexity.

**Target:** UK tradespeople (fitters, installers, surveyors) on-site and in the workshop, on tablet and mobile.

---

## 2. Visual Identity

### Logo System

**Icon Logo (182×182px)**
- Used for app launcher, navigation, favicons, social avatars
- Available in navy (primary) and white (inverse)
- Minimum size: 32px (never smaller)

**Lockup Logo (920×256px)**
- Wordmark "STURIJ" with icon
- Primary mark for website hero, marketing materials, documents
- Available in black and white (with transparent background)

### Colour Palette

| Name | Hex | Usage | RGB |
|------|-----|-------|-----|
| Navy | `#20384a` | Primary action, headings, active states | 32, 56, 74 |
| Gold | `#d4aa58` | Accent, progress, selection, CTAs | 212, 170, 88 |
| Bronze | `#8b5e2c` | Labels, kickers, secondary accent | 139, 94, 44 |
| Paper (Light) | `#faf8f2` | App background, surfaces | 250, 248, 242 |
| Card | `#fdfcf8` | Panels, inputs, cards | 253, 252, 248 |
| Ink Dark | `#241f1a` | Headings, display text | 36, 31, 26 |
| Ink Body | `#3d3830` | Body copy (17px/1.7) | 61, 56, 48 |
| Ink Muted | `#6b6358` | Secondary text, labels | 107, 99, 88 |
| Success | `#4a7c59` | Approved states, confirmation | 74, 124, 89 |
| Info | `#5b8a9a` | Hints, windows, placement | 91, 138, 154 |
| Danger | `#a95d41` | Remove actions, warnings | 169, 93, 65 |

---

## 3. Typography

### Font Stack

| Role | Family | Weights | Usage |
|------|--------|---------|-------|
| **Display** | DM Serif Display | 400 (regular) | Headlines, welcome titles |
| **Body** | DM Sans | 400–600 (variable) | All UI copy, inputs, buttons |
| **Mono** | IBM Plex Mono | 600 (semibold) | Labels, kickers, dimension text |

### Type Scale

| Size | Name | Weight | Line Height | Tracking | Usage |
|------|------|--------|-------------|----------|-------|
| 32px | Display | 400 | 1.08 | +0.008em | Welcome headline |
| 26px | H1 | 500 | 1.2 | +0.015em | Page title |
| 21px | H2 | 500 | 1.2 | +0.015em | Section heading |
| 17px | Body | 400 | 1.7 | — | Body copy (60ch max) |
| 15px | UI | 500 | 1 | — | Button labels |
| 13px | Small | 400 | 1.4 | — | UI secondary text |
| 12px | Kicker | 600 | 1 | +0.14em | Labels (all caps) |
| 11px | Caption | 600 | 1 | +0.1em | Form labels, dense text |
| 10px | Mono | 600 | 1 | +0.08em | Dimension labels |

**Rules:**
- Serif never bold
- Mono always uppercase for labels
- Body copy maximum 60 characters wide
- Form labels use kicker style in bronze on light, gold on dark

---

## 4. Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 4px | Micro spacing inside components |
| **sm** | 8px | Between related items |
| **md** | 14px | Standard internal padding |
| **lg** | 22px | Outer padding, section gaps |
| **xl** | 40px | Generous spacing between blocks |
| **xxl** | 80px | Major section separation |
| **Sidebar width** | 330px | Fixed sidebar, drawer width |
| **Measure** | 60ch | Maximum body text width |
| **Touch target** | 44px (min) | All buttons, inputs, interactive elements |

### Radius Scale (4 values only)

| Token | Value | Usage |
|-------|-------|-------|
| `field` | 8px | Input fields, segment buttons |
| `btn` | 10px | Button corners |
| `card` | 16px | Card panels, modals |
| `pill` | 999px | Chips, pills, avatars |

---

## 5. Shadows

| Token | Value | Usage |
|--------|-------|-------|
| `card` | `0 1px 2px rgba(35,31,27,.04), 0 10px 30px rgba(35,31,27,.08)` | Cards at rest |
| `float` | `0 2px 8px rgba(35,31,27,.06)` | Floating toolbars, popovers |
| `panel` | `0 8px 32px rgba(35,31,27,.10)` | Floating panels, live view |
| `modal` | `0 2px 6px rgba(26,24,21,.28), 0 18px 50px rgba(26,24,21,.35), 0 44px 120px rgba(26,24,21,.5)` | Modals, dialogs |

---

## 6. Component Specs

### Buttons

**Primary Button**
- Height: 44px
- Padding: 0 16px
- Radius: 10px
- Bg: `linear-gradient(180deg, #27435b 0%, #1d3242 100%)`
- Text: `rgba(250, 248, 242, 0.96)` · 15px DM Sans 550
- Shadow: `inset 0 1px 0 rgba(250,248,242,.14), 0 1px 2px rgba(35,31,27,.28), 0 4px 12px rgba(35,31,27,.16)`
- Hover: `translateY(-1px)`, shadow lift
- Active: `scale(0.97)`

**Secondary Button**
- Height: 44px
- Padding: 0 16px
- Radius: 10px
- Bg: transparent
- Border: 1px `rgba(35,31,27,.12)`
- Text: `#3d3830` · 15px DM Sans 500
- Hover: Border → `#8b5e2c`, text → bronze
- Active: `scale(0.97)`

### Form Inputs

**Input Field**
- Height: 44px
- Padding: 0 12px
- Radius: 8px
- Bg: `#fdfcf8`
- Border: 1px `rgba(35,31,27,.14)`
- Text: `#3d3830` · 15px DM Sans 400
- Focus: 2px navy ring, border → gold
- Label above: Kicker style (12px IBM Plex Mono 600, bronze, uppercase)

### Cards & Panels

**Card**
- Bg: `#fdfcf8`
- Border: 1px `rgba(35,31,27,.07)`
- Radius: 16px
- Padding: 18px
- Shadow: `card` (see §5)

**Panel** (internal drawer/modal)
- Bg: `#fdfcf8`
- Border: 1px `rgba(35,31,27,.12)`
- Radius: 12px
- Padding: 16px
- Shadow: `panel` (see §5)

### Chips & Pills

- Height: 32px
- Padding: 6px 14px
- Radius: 999px
- Font: 12px IBM Plex Mono 600, uppercase
- Bg: `rgba(212,170,88,.08)` (gold tint) or `#f5f2ec` (neutral)
- Border: 1px `rgba(35,31,27,.12)`
- Inner highlight: `inset 0 1px 0 rgba(255,255,255,.45)`
- Shadow: soft, `0 1px 2px rgba(35,31,27,.04)`

---

## 7. Motion & Interaction

| Duration | Token | Usage |
|----------|-------|-------|
| 150ms | `fast` | Color/opacity transitions |
| 200ms | `quick` | Standard interaction |
| 250ms | `base` | Scale, progress width |
| 300ms | `long` | Complex animations |
| 500ms | `slow` | Ambient, scan loops |

**Easings:**
- Out: `cubic-bezier(0.2, 0.7, 0.3, 1)` — default for interactive feedback
- In: `cubic-bezier(0.4, 0, 0.6, 1)` — entrance animations
- InOut: `cubic-bezier(0.4, 0, 0.2, 1)` — complex transitions

**Reduce Motion:** All animation gates behind `prefers-reduced-motion: reduce` media query.

---

## 8. Dark Mode

**Dark Surface Tokens:**
- Paper: `#1f1c18` (deep warm brown, NOT pure black)
- Card: `#2a2520`
- Text (heading): `#f0ede6` (warm white, 92% paper)
- Text (body): `rgba(250,248,242,.88)`
- Lines: `rgba(250,248,242,.12)`

**Dark Band** (sidebar, dark sections):
- Gradient: `linear-gradient(180deg, #443e35 0%, #37322a 100%)`
- Inner top-light: `inset 0 1px 0 rgba(250,248,242,.14)`
- Shadow: deep, `0 24px 70px rgba(26,24,21,.2)`

**Color Shifts (dark mode):**
- Gold remains `#d4aa58` (maintains pop on dark)
- Success remains `#4a7c59` (sufficient contrast)
- Navy shifts to `#5b8a9a` (info, lighter in dark)

---

## 9. Icon System

**Three Device Contexts:**

| Device | Size | Radius | Border | Bg | Icon Stroke |
|--------|------|--------|--------|----|----|
| Identity (avatar) | 32px | 999px | 2px bronze | Gold 10% | 1.5px, bronze |
| Tool (toolbar) | 46px | 10px | 2px ink | `#fdfcf8` | 1.5px, ink |
| Launcher (home) | 56px | 999px | 2px gold | Navy | 1.5px, gold |

**Icon Grid:** 20px base grid · Line weight 1.5px · Round caps & joins · Monoline (no filled shapes).

---

## 10. Layout Templates

### Standard App Layout (ToolPage)

```
┌─────────────────────────────────────────────────────┐
│ Header 64px: Logo · [Chips] · [Action buttons]     │
├──────────┬───────────────────────────────────────────┤
│ Sidebar  │ Main content area (canvas/viewport)      │
│ 330px    │                                           │
│ 64px     │ [Floating panels, controls]              │
│ icon     │                                           │
│ rail     │                                           │
└──────────┴───────────────────────────────────────────┘
```

**Sidebar:** Vertical 46px icon buttons (radius 10px) → slide-out drawer per step.

**Header:** 64px tall, flex row: logo (40px) · grow space · actions (right).

**Icon Tooltips:** Hover on rail icon shows soft-white card (radius 12, shadow): mono-caps title (kicker) + one 12.5px muted line (never native title attribute).

---

## 11. Drawer / Modal Pattern

**Drawer Header:**
- Mono-caps step title (12px IBM Plex Mono 600)
- Muted one-liner (13px body, ink-muted)
- 30px round ✕ button (navy on hover)

**Drawer Body:**
- Collapsible accordions
- Header: mono-caps label (left) + quiet ▾ (right)
- Gold-tint bg when open + hairline underline
- 16px padding

**Drawer Footer:**
- Full-width navy button (44px height)
- "Next · {step}" or "Save & approve" on last
- 16px sticky padding, 1px hairline above (soft-white, never shadow)

**Modal (variant):**
- No border
- Layered shadow (modal, see §5)
- 9px blur veil behind (warm paper at 55%)
- 16px radius
- Centered, max 90vw

---

## 12. Brand Applications

### Website Hero

Hero lockup (920×256px) centered on gradient background:
- Gradient: `linear-gradient(135deg, rgba(32,56,74,.95), rgba(139,94,44,.05))`
- Background: Paper with workshop graph-paper pattern (see prototype)
- Heading below: "AI-powered wardrobe visualization for tradespeople"
- CTA: Primary button (navy)

### Social Media Assets

**LinkedIn Cover (1500×500px):**
- Navy bg, icon logo (182×182) centered
- Tagline: "Visualize. Customize. Approve." (H2 serif, paper)

**Twitter Card (1200×675px):**
- Split: icon left (gold tint circle), copy right
- Headline + subheading (body, serif)

**Product Thumbnail (400×400px):**
- Icon logo centered, navy/gold bg, hard shadow

### Marketing Collateral

**Email Header:**
- Lockup logo (920×256 scaled to fit width)
- Navy footer bar, paper text
- Kicker: "Building beautiful furniture. Fast."

**PDF Documents:**
- Header: Navy band (2cm height), white lockup logo
- Body: Paper bg, serif headings, body copy max 60ch
- Footer: Bronze kicker + page number

---

## 13. Implementation Checklist

For Claude Cowork Marketing System:

- [ ] Logo assets stored as SVG + PNG (transparent)
- [ ] Color palette added to brand kit (Figma/design tool)
- [ ] Typography settings: DM Sans (variable), DM Serif Display, IBM Plex Mono
- [ ] Component library: Button, Input, Card, Chip, Modal specs
- [ ] Email templates using navy header + kicker footer
- [ ] Website hero template with gradient + logo
- [ ] Social media templates (LinkedIn, Twitter, Instagram)
- [ ] Dark mode variants for all key colors
- [ ] Motion guidelines documented (gate behind `prefers-reduced-motion`)
- [ ] Accessibility checklist (WCAG 2.1 AA, 4.5:1 contrast minimum)
- [ ] PDF template with navy header, serif headings, 60ch measure

---

## 14. Guardrails

**DO:**
- Pair serif display with sans body (never serif for body text)
- Use navy for primary actions, gold for accent/progress
- Limit radius to four values: 8px, 10px, 12px, 16px (and 999px for pills)
- Maximum button height 50px, minimum 44px
- Keep all text readable on both light and dark (check 4.5:1 contrast)
- Gate animation behind `prefers-reduced-motion`

**DON'T:**
- Use pure black (#000000) or pure white (#ffffff) — use navy/paper instead
- Stack multiple shadows (use one shadow from the scale)
- Hardcode hex values (always reference token names)
- Use serif font for anything under 20px (readability breaks)
- Forget touch targets on mobile (44px minimum)
- Violate the 60-character measure for body text

---

## 15. Contact & Versioning

**Document Version:** 1.0 · July 2026
**Design System Base:** Sturij Visualiser v4 (prototype in Figma)
**Last Updated:** 2026-07-09

For brand questions, design audits, or component additions, route through the design system page (`Sturij Design System.dc.html`) — audit before ship.
