---
name: VAYORA Portal
colors:
  surface: '#161311'
  surface-dim: '#161311'
  surface-bright: '#3c3836'
  surface-container-lowest: '#100e0c'
  surface-container-low: '#1e1b19'
  surface-container: '#221f1d'
  surface-container-high: '#2d2927'
  surface-container-highest: '#383432'
  on-surface: '#e9e1dd'
  on-surface-variant: '#d1c6ab'
  inverse-surface: '#e9e1dd'
  inverse-on-surface: '#33302d'
  outline: '#9a9078'
  outline-variant: '#4d4632'
  surface-tint: '#eec200'
  primary: '#ffecb9'
  on-primary: '#3c2f00'
  primary-container: '#facc15'
  on-primary-container: '#6c5700'
  inverse-primary: '#735c00'
  secondary: '#f7bd48'
  on-secondary: '#412d00'
  secondary-container: '#ba880f'
  on-secondary-container: '#392700'
  tertiary: '#f1eddd'
  on-tertiary: '#323126'
  tertiary-container: '#d4d1c2'
  on-tertiary-container: '#5b5a4e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe083'
  primary-fixed-dim: '#eec200'
  on-primary-fixed: '#231b00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffdea6'
  secondary-fixed-dim: '#f7bd48'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#e6e3d3'
  tertiary-fixed-dim: '#cac7b8'
  on-tertiary-fixed: '#1c1c13'
  on-tertiary-fixed-variant: '#48473c'
  background: '#161311'
  on-background: '#e9e1dd'
  surface-variant: '#383432'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.04em
  currency-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.02em
  currency-caption:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 0.75rem
  gutter-lg: 2rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses a synthesis of ultra-luxury hospitality management and mission-critical financial precision. Designed for executive maîtres d', general managers, and culinary directors operating in prestigious dining venues, the UI bridges high-throughput service speed with the understated prestige of private banking.

### Visual Aesthetic & Language
The design style unites modern corporate slate minimalism with subtle, translucent glassmorphic layering and luminous metallic accents. The interface relies on deliberate, pitch-dark backdrops layered with warm charcoal containers, thin structural micro-borders, and targeted strikes of bright gold for actionable signals and financial metrics.

### Key Experiential Pillars
- **Executive Composure:** Dark charcoal and slate substrates minimize eye strain across 14-hour high-volume floor shifts while preserving visual sophistication under ambient dining room lighting.
- **Financial Rigor:** Real-time revenue tallies, average check metrics, and order logs mimic institutional trading terminals, prioritizing tabular alignments, instant status legibility, and high numeric scannability.
- **Tactile Dignity:** Restrained translucency, precise micro-borders (1px at low opacity), and gold-tinged focus indicators deliver depth without ornamental bloat.

## Colors

The color palette is architected for a rich dark-mode environment, combining deep mineral tones with gilded culinary accents.

### Palette Hierarchy & Intent

- **Primary (`#FACC15`):** High-luminance gold. Reserved for high-priority interactive touchpoints, primary conversion triggers, urgent active alerts, and prominent key performance indicators (KPIs).
- **Secondary (`#B8860B`):** Deep burnished gold. Deployed for subtle metallic accents, secondary outlines, hover states of gold elements, and non-critical progress tracking.
- **Tertiary (`#FFFBEB`):** Soft cream highlight. Used selectively for elevated header text, high-tier status badges, and subtle internal glow reflections on glass surfaces.
- **Neutral Dark Base (`#1C1917` & `#292524`):** Warm obsidian and slate charcoal. Defines the canvas foundations and structured containers, preventing the harsh optical fatigue of pure `#000000`.

### Surface & Border Semantics
- **Canvas Base:** `#0F0E0D` (Deep obsidian black floor)
- **Surface Level 1 (Panels & Shell):** `#1C1917` (Deep stone neutral)
- **Surface Level 2 (Cards & Modules):** `#292524` (Charcoal container)
- **Surface Level 3 (Modals & Flyouts):** `#342F2D` (Elevated charcoal)
- **Micro-Borders:** `rgba(250, 204, 21, 0.12)` for standard card framing; `rgba(255, 255, 255, 0.08)` for subtle structural grids.

### Status System
- **Pending:** Amber gold (`#F59E0B`, surface `rgba(245, 158, 11, 0.12)`)
- **Preparing:** Luminous cyan-azure (`#38BDF8`, surface `rgba(56, 189, 248, 0.12)`)
- **Ready:** Deep emerald (`#10B981`, surface `rgba(16, 185, 129, 0.12)`)
- **Delivered:** Warm slate-cream (`#A8A29E`, surface `rgba(168, 162, 158, 0.14)`)
- **Cancelled:** Ruby crimson (`#F43F5E`, surface `rgba(244, 63, 94, 0.12)`)

## Typography

Typography establishes an unambiguous visual hierarchy across crowded operational data displays.

### Role Allocation
- **Plus Jakarta Sans:** Governs displays, section titles, table headlines, and revenue figures. Its contemporary geometric geometry conveys authority while soft curves introduce hospitality refinement.
- **Inter:** Powers tabular lists, table item details, customer receipts, and form fields. It provides neutral, undistorted legibility under all scanning conditions.

### Financial & Currency Representation
- UAE Dirham values must pair `currency-caption` ("AED") in uppercase medium-weight with `currency-display` numbers set to tabular figures (`font-variant-numeric: tabular-nums`). This prevents baseline shifting during real-time order balance changes.
- Large currency metric headers should highlight decimal subdivisions in an intermediate opacity (`rgba(255, 255, 255, 0.6)`) to preserve visual focus on the primary integer sum.

## Layout & Spacing

The layout employs a dense, structured 12-column grid system tuned for 4K dining room wallboards, executive desktop setups, and high-density tablet ordering screens.

### Grid Architecture
- **Desktop (1440px and above):** 12-column fluid grid. Column gutter is locked to `gutter-lg` (`2rem`), canvas padding uses `margin` (`2rem`).
- **Tablet / Floor Terminal (768px – 1439px):** 8-column layout. Column gutter scales to `gutter` (`1.5rem`), outer margins scale to `1.5rem`.
- **Mobile Handheld (Below 768px):** 4-column layout. Gutters compress to `gutter-sm` (`0.75rem`), with a safe edge padding of `margin-mobile` (`1rem`).

### Component Spacing Discipline
- `space-xs` (4px): Used exclusively for micro badge interior offsets and label-to-indicator spacing.
- `space-sm` (8px): Default gap for table row meta items, chip list clusters, and icon-to-text couplings.
- `space-md` (16px): Internal module padding for compact data cells, order card content separators, and form input gutters.
- `space-lg` (24px): Standard internal padding across cards, metric summary panels, and modal shells.
- `space-xl` (40px): Section vertical spacing separating the primary metrics bar from the table orchestration grid.

## Elevation & Depth

Depth is defined through layered dark materials, subtle glassmorphism, and gold micro-borders rather than aggressive drop shadows.

### Surface Elevation Strategy
- **Layer 0 (Canvas):** Pure base (`#0F0E0D`), non-reflective matte finish.
- **Layer 1 (Standard Panel):** Flat stone surface (`#1C1917`) with a 1px perimeter border of `rgba(255, 255, 255, 0.06)`. No outer shadow.
- **Layer 2 (Elevated Dashboard Card):** Solid charcoal base (`#292524`) overlaid with 85% opacity, backdrop blur of 16px, and a dual border: an outer 1px border of `rgba(250, 204, 21, 0.15)` and an ambient drop shadow tinted with deep amber: `0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(250, 204, 21, 0.08)`.
- **Layer 3 (Floating Menus & Modals):** High-blur frosted slate (`#342F2D` at 90% opacity), `backdrop-filter: blur(24px)`, coupled with a distinct 3D micro-bevel: a 1px top highlight of `rgba(255, 251, 235, 0.15)` and an external shadow of `0 24px 48px -8px rgba(0, 0, 0, 0.8)`.

### 3D Dimensional Accents
Key interactive elements utilize a tactile 1px inner inset glow (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15)`) to replicate physical high-end aluminum instrumentation bevels found in commercial luxury kitchens.

## Shapes

The design system adopts a balanced roundedness model (`roundedness: 2`). This choice delivers a tailored, precision-cut character that echoes contemporary architectural joinery.

### Radii Distribution
- **Controls & Buttons:** 0.5rem (8px). Maintains structured discipline without appearing industrial or blocky.
- **Badges & Pill Selectors:** Fully rounded pill-capsules (9999px) to visually delineate dynamic state indicators from actionable modular cards.
- **Cards, Panels & Data Containers:** `rounded-lg` (1rem / 16px). Creates a cohesive framing unit for dense groups of customer and billing data.
- **Large Modals & Floor Plan Drawers:** `rounded-xl` (1.5rem / 24px). Softens dominant overlay interfaces that appear during table transfers or checkout flows.

## Components

### Buttons
- **Primary:** Background in solid `#FACC15` with crisp `#1C1917` text, font weight 600. Includes an interior highlight bevel (`inset 0 1px 0 rgba(255, 255, 255, 0.3)`). Hover triggers a gentle transition to `#B8860B` with an ambient glow of `0 0 16px rgba(250, 204, 21, 0.35)`.
- **Secondary / Ghost:** Transparent background enclosed by a 1px micro-border in `rgba(250, 204, 21, 0.3)`. Text color is `#FFFBEB`. Hover state applies an interior fill of `rgba(250, 204, 21, 0.08)`.
- **Destructive:** Background `rgba(244, 63, 94, 0.12)`, border `1px solid rgba(244, 63, 94, 0.3)`, text `#FB7185`.

### Order Status Badges
Badges are capsule-shaped (`border-radius: 9999px`), padding `0.25rem 0.75rem`, featuring a 6px pulsing or static circular status pip at the leading edge.
- **Pending:** Border `1px solid rgba(245, 158, 11, 0.4)`, background `rgba(245, 158, 11, 0.1)`, text `#FBBF24`.
- **Preparing:** Border `1px solid rgba(56, 189, 248, 0.4)`, background `rgba(56, 189, 248, 0.1)`, text `#38BDF8`.
- **Ready:** Border `1px solid rgba(16, 185, 129, 0.4)`, background `rgba(16, 185, 129, 0.1)`, text `#34D399`.
- **Delivered:** Border `1px solid rgba(168, 162, 158, 0.3)`, background `rgba(168, 162, 158, 0.08)`, text `#D6D3D1`.
- **Cancelled:** Border `1px solid rgba(244, 63, 94, 0.4)`, background `rgba(244, 63, 94, 0.1)`, text `#F87171`.

### Data Cards & Modules
- Structured using `#292524` with a 1px border `rgba(255, 255, 255, 0.08)`.
- Header bars utilize bottom divider lines in `rgba(255, 255, 255, 0.05)` and feature title elements set in `Plus Jakarta Sans`.
- Cards presenting AED financial tallies must position the `AED` badge right-aligned, rendered in `label-sm` with letter spacing `0.08em` in `#B8860B`.

### Input Fields & Controls
- Form controls display on `#1C1917` with a 1px perimeter border in `rgba(255, 255, 255, 0.12)`.
- Focus states shift the border to `#FACC15` and cast a 2px outer glow (`0 0 0 2px rgba(250, 204, 21, 0.2)`).
- Placeholder text is set to `rgba(255, 251, 235, 0.35)`.

### Lists & Order Rows
- Table rows rely on subtle hover backgrounds (`rgba(255, 255, 255, 0.03)`).
- Separator borders are 1px solid `rgba(255, 255, 255, 0.04)`.
- Active table selection indicators display as a 3px solid `#FACC15` left-border accent spanning the height of the row.

### Floor Plan / Table Allocation Nodes (Domain Specific)
- Table indicators are rendered as rounded geometric representations of seating arrangements.
- Vacant tables use muted charcoal borders (`rgba(255, 255, 255, 0.15)`).
- Occupied and dining tables exhibit active soft amber backlights (`rgba(250, 204, 21, 0.06)`).
- VIP-flagged tables incorporate a double micro-border featuring deep gold (`#B8860B`) with table capacity chips in `#FFFBEB`.