# Tanhwe Guest House — Design Style Guide

> Single source of truth for all visual and interaction decisions in Tanhwe Guest House.
> Reference this file before writing any UI code.
>
> **Aesthetic**: Warm hospitality minimalism (clean, calm, modern, professional, trustworthy)
> **Scope**: Public website (homepage, rooms, booking, contact) + Admin dashboard (operations, rooms, bookings, customers, settings)

---

## 1. Design Philosophy

Tanhwe Guest House is a hospitality business in Mukwe, Namibia. The UI must feel **warm, calm, trustworthy, and practical** — appropriate for guests planning a stay and staff managing operations.

**Three core principles:**

1. **Warm hospitality** — Generous whitespace, warm neutrals (sand/cream), subtle orange accents. The interface should feel like a welcoming guest house, not a generic SaaS product.
2. **Image-led** — Real guest house imagery takes visual priority over decorative elements. Photographs of rooms, the garden, and conference facilities should anchor each section.
3. **Quiet confidence** — Clean typography, refined borders, deliberate spacing. No gradients, no blobs, no glassmorphism, no AI-generated landing-page clichés.

---

## 2. Typography

### Font Family

**Body font: [Onest](https://fonts.google.com/specimen/Onest)** (Google Fonts)
- Clean geometric sans with excellent legibility at small sizes
- Crisp numerals (critical for pricing, invoices, booking numbers)
- Open-source, fast to load

**Heading font: [Inter Tight](https://fonts.google.com/specimen/Inter+Tight)** (Google Fonts)
- Distinctive tightened letterforms for headings
- Already used in the existing codebase — preserved for visual continuity

Load both via `next/font/google` and apply via CSS variables.

### Type Scale

| Style | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| `display` | 48px | 600 | 1.1 | -0.02em | Homepage hero, marketing headlines |
| `display-sm` | 36px | 600 | 1.15 | -0.02em | Section headers on landing pages |
| `h1` | 30px | 600 | 1.2 | -0.015em | Page titles |
| `h2` | 24px | 600 | 1.25 | -0.01em | Section headings |
| `h3` | 20px | 600 | 1.3 | -0.005em | Card titles, modal titles |
| `h4` | 16px | 600 | 1.4 | 0 | List item titles, labels |
| `body-lg` | 16px | 400 | 1.55 | 0 | Marketing body copy |
| `body` | 14px | 400 | 1.5 | 0 | Default dashboard body text |
| `body-sm` | 13px | 400 | 1.5 | 0 | Secondary info, table data |
| `caption` | 12px | 500 | 1.4 | 0.01em | Meta, timestamps, badges |
| `micro` | 11px | 600 | 1.3 | 0.04em | Uppercase labels, eyebrows (uppercase) |
| `tabular` | 14px | 500 | 1.5 | 0 | Numbers, amounts — use `font-variant-numeric: tabular-nums` |

**Rules:**
- Headings use weight 600, never 700 or 800 in UI chrome
- Marketing display headlines may use 600
- **Always** use `tabular-nums` for money, quantities, and booking numbers
- Line-height: tighter (1.1–1.3) for display/headings, 1.5 for body

---

## 3. Color Palette

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#FEF7EE` | Subtle orange backgrounds, hover surfaces |
| `primary-100` | `#FDEDD6` | Soft highlights, avatar bg |
| `primary-200` | `#FBD7A7` | Focus rings (light mode) |
| `primary-500` | `#E89008` | **Primary brand** — main CTA, active states, selected items |
| `primary-600` | `#CF7A00` | Button hover / pressed |
| `primary-700` | `#A85E00` | Deep accent for dark mode |
| `primary-900` | `#7A3F00` | Text on light bg (rarely) |

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary-50` | `#EEF4FA` | Subtle blue backgrounds |
| `secondary-100` | `#D6E5F5` | Soft highlights |
| `secondary-500` | `#0D5CA8` | **Secondary brand** — links, secondary actions |
| `secondary-600` | `#0A4A8A` | Hover for secondary |
| `secondary-700` | `#07386C` | Deep accent |

### Neutrals (Warm Sand)

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#FDFCF9` | Page background |
| `surface` | `#FFFDF8` | Card backgrounds (cream) |
| `neutral-100` | `#F5F1E8` | Card rails, table header bg, muted surfaces |
| `neutral-200` | `#E6E0D3` | Borders, dividers, input outlines |
| `neutral-300` | `#D5CCBB` | Placeholder text on light, disabled borders |
| `neutral-400` | `#B8AD99` | Placeholder, meta text, secondary icons |
| `neutral-500` | `#9A8E7A` | Secondary text, captions |
| `neutral-600` | `#7A6F5E` | Body text secondary |
| `neutral-700` | `#5A5144` | Body text primary (on white) |
| `neutral-800` | `#3D372E` | Headings, primary text |
| `neutral-900` | `#221F19` | Deep text (rarely) |
| `white` | `#FFFFFF` | Cards, modals, sidebar |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `success-50` | `#ECFDF5` | Paid badge bg, success toast bg |
| `success-600` | `#059669` | Paid status, checkmarks |
| `warning-50` | `#FFFBEB` | Pending badge bg, due-soon alerts |
| `warning-600` | `#D97706` | Overdue warnings |
| `error-50` | `#FEF2F2` | Error toast bg, destructive confirm |
| `error-600` | `#DC2626` | Errors, destructive actions |
| `info-50` | `#EFF6FF` | Info banner bg |
| `info-600` | `#2563EB` | Info text |

### Status Colors

| Status | Background | Text |
|--------|-----------|------|
| Pending | `warning-50` | `warning-600` |
| Confirmed | `primary-50` | `primary-600` |
| Checked-in | `info-50` | `info-600` |
| Checked-out | `success-50` | `success-600` |
| Cancelled | `neutral-100` | `neutral-500` |
| No-show | `error-50` | `error-600` |

**Rules:**
- Strong orange is used only for: main booking CTA, important selected states, high-priority actions, small brand accents
- Blue is used for: secondary actions, informational states, links, supporting accents
- Never cover large page areas with strong orange and blue together
- No gradients in app UI chrome (marketing hero may use subtle radial)

---

## 4. Spacing

**8px base grid.** All spacing = multiple of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (badge padding) |
| `space-2` | 8px | Between related inline elements |
| `space-3` | 12px | Input internal padding, card gaps |
| `space-4` | 16px | Standard gap between components |
| `space-5` | 20px | Card internal padding (small cards) |
| `space-6` | 24px | Card internal padding (default) |
| `space-8` | 32px | Between sections within a page |
| `space-10` | 40px | Section separators |
| `space-12` | 48px | Large section breaks |
| `space-16` | 64px | Marketing section padding |
| `space-24` | 96px | Landing hero vertical padding |

**Page-level spacing:**
- Public content max-width: `1180px` with `px-4 sm:px-6`
- Admin content max-width: `1280px` with `px-4 sm:px-6 lg:px-8`
- Sidebar width: `240px`
- Section-to-section gap: `32px`
- Card internal padding: `24px` (default), `20px` (small cards)

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Inputs, small chips, tag pills |
| `radius` | 8px | **Default** — buttons, badges, small cards |
| `radius-md` | 10px | Medium cards, modals content |
| `radius-lg` | 12px | Main dashboard cards, table containers |
| `radius-xl` | 16px | Modal outer shell, feature cards |
| `radius-2xl` | 20px | Hero image container (public site only) |
| `radius-full` | 9999px | Avatars, status dots, icon pills |

**Rule:** Never mix radius values in the same container. A card with `radius-lg` should contain children with `radius` or smaller.

---

## 6. Shadows & Elevation

```
shadow-xs: 0 1px 2px 0 rgba(34, 31, 25, 0.05)
shadow-sm: 0 1px 3px 0 rgba(34, 31, 25, 0.08), 0 1px 2px -1px rgba(34, 31, 25, 0.04)
shadow-md: 0 4px 6px -1px rgba(34, 31, 25, 0.08), 0 2px 4px -2px rgba(34, 31, 25, 0.04)
shadow-lg: 0 10px 15px -3px rgba(34, 31, 25, 0.08), 0 4px 6px -4px rgba(34, 31, 25, 0.04)
shadow-xl: 0 20px 25px -5px rgba(34, 31, 25, 0.10), 0 8px 10px -6px rgba(34, 31, 25, 0.04)
```

**Usage:**
- Cards on page: `shadow-xs` + border
- Hover on interactive cards: `shadow-sm`
- Dropdowns & popovers: `shadow-md` + border
- Modals: `shadow-xl`
- **Inputs have NO shadow** — use border only
- Focus rings: use ring utility instead of shadow

**Philosophy:** Borders do most of the work. Shadows are subtle — a hint of depth.

---

## 7. Component Specifications

### 7.1 Buttons

**Primary Button**
- Background: `primary-500` (`#E89008`)
- Text: White, `14px` weight 500
- Height: `36px` (default), `32px` (sm), `40px` (lg)
- Horizontal padding: `16px`
- Border radius: `radius` (8px)
- Hover: `primary-600`
- Active: scale(0.98)
- Focus: ring `primary-200`
- Disabled: opacity 50%
- Loading: spinner replaces icon, text stays

**Secondary Button (Outline)**
- Background: White or transparent
- Border: `1px solid neutral-200`
- Text: `neutral-700`, 14px weight 500
- Hover: `neutral-50` bg, `neutral-300` border

**Ghost Button**
- Background: Transparent
- Text: `neutral-600`, 14px weight 500
- Hover: `neutral-100` bg

**Destructive Button**
- Background: `error-50`
- Text: `error-600`
- Hover: `error-100` bg

**Link**
- Color: `secondary-500`
- Hover: underline

### 7.2 Inputs
- Height: `36px`
- Background: White
- Border: `1px solid neutral-200`
- Radius: `radius-sm` (6px)
- Padding: `10px 12px`
- Text: `14px`
- Placeholder: `neutral-400`
- Focus: `primary-500` border + ring
- Disabled: opacity 50%
- Invalid: `error-600` border
- Label above: `13px` weight 500, `8px` gap

### 7.3 Cards
- Background: White (`#FFFFFF`) or `surface` (`#FFFDF8`)
- Border: `1px solid neutral-200`
- Radius: `radius-lg` (12px)
- Shadow: `shadow-xs`
- Padding: `24px`
- Hover (if interactive): `shadow-sm`

### 7.4 Tables
- Header row: `bg-neutral-100`, `12px` weight 600 uppercase, `40px` tall
- Body row: `48px` tall, `14px`
- Border bottom: `1px solid neutral-100`
- Hover row: `bg-neutral-50`
- First column padding: `16px` left
- Last column padding: `16px` right
- Sort indicators: neutral chevron
- Zebra striping: off

### 7.5 Status Badges
- Height: `22px`
- Padding: `2px 8px`
- Radius: `radius-full`
- Font: `11px` weight 600
- Background + text: see §3 Status Colors

### 7.6 Sidebar (Admin)
- Width: `240px`
- Background: White
- Border right: `1px solid neutral-200`
- Padding: `8px`
- Logo block: `56px` tall
- Nav item height: `36px`
- Active state: left 2px accent bar
- Icon: `16px`

### 7.7 Top Bar
- Height: `56px`
- Background: White
- Border bottom: `1px solid neutral-100`

### 7.8 Empty States
- Centered in container
- Icon: `40px`, `neutral-300`
- Title: `h3`
- Description: `body` `neutral-500`
- Primary CTA below, `24px` margin

---

## 8. Motion & Animation

**Principles:** Fast, subtle, purposeful.

| Transition | Duration | Easing |
|-----------|----------|--------|
| Button press | `100ms` | `ease-out` |
| Hover state | `150ms` | `ease-out` |
| Dropdown/popover | `150ms` | `ease-out` |
| Page transitions | `200ms` | `ease-out` |
| Image hover | `500ms` | `ease-out` |

**Allowed:**
- `transition-colors` on interactive elements
- Image scale on card hover (subtle, max 1.03x)
- Fade in for dialogs
- Skeleton shimmer for loading

**Disallowed:**
- Bouncing buttons, floating elements, heavy parallax
- Scroll hijacking
- Animated gradients
- Springs
- Motion > 500ms

**Accessibility:**
- Respect `prefers-reduced-motion`
- All animations use transform and opacity only

---

## 9. Responsive Breakpoints

**Mobile-first — every layout starts as single-column.**

| Breakpoint | Width | Target |
|---|---|---|
| Default | 360px+ | Phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

**Rules:**
- Test every page at 375px before completion
- Touch targets: minimum `44×44px` on mobile
- Tables → stacked cards below `md`
- Sidebar → Sheet drawer below `lg`
- Modals → full-screen below `sm`

---

## 10. Accessibility

- Color contrast: `4.5:1` for body text, `3:1` for large text
- Focus rings: visible on all interactive elements, never removed with `outline-none` alone
- Icons used alone: include `aria-label` or `sr-only` text
- Form fields: always have `<label>` linked via `htmlFor`
- Status badges: don't rely on color alone — include text + dot
- Semantic HTML: use `<button>` for actions, `<a>` for navigation
- `prefers-reduced-motion`: respect motion preferences

---

## 11. Do's & Don'ts

**Do:**
- Use warm sand/cream neutrals as the canvas
- Use orange sparingly — for the main CTA and small accents
- Use `tabular-nums` for all money and quantities
- Rely on borders + subtle shadows for hierarchy
- Keep generous whitespace
- Lead with real photography
- Use Lucide icons consistently

**Don't:**
- Use heavy shadows
- Use orange and blue together on large areas
- Use gradients, glassmorphism, or decorative blobs
- Use emoji in UI chrome
- Mix border radius within a container
- Use font weights above 600 in app UI
- Cover page areas with strong color
- Clone Airbnb or generic SaaS templates
