# Tanhwe UI Audit — Current State

> Audit performed June 23, 2026 against production site (https://tanhweguesthouse.vercel.app) and repository code.

---

## 1. Typography

### Current State
- **Body font**: Inter (Google Fonts) — loaded via `next/font/google`
- **Heading font**: Inter Tight (Google Fonts) — loaded via `next/font/google`
- **Type scale**: Inconsistent. Some pages use `text-3xl`, `text-4xl`, `text-5xl` without a coherent scale.
- **Weights**: Mix of `font-bold (700)`, `font-semibold (600)`, and `font-medium (500)` with no clear rules.
- **Line-height**: Inconsistent — some headings use Tailwind defaults, custom ones use `leading-[.88]`.

### Issues
- Two font families (Inter + Inter Tight) load ~4-6 font files, impacting performance
- No clear type scale documented — ad-hoc sizes throughout
- Heading weights inconsistent (700 on some, 600 on others)
- Missing `tabular-nums` on some money displays
- Small text (11-12px) not used consistently for metadata

---

## 2. Color Palette

### Current State
- **Primary**: Orange `#E89008` (OKLCH-based in globals.css)
- **Secondary**: Blue `#0D5CA8`
- **Background**: Warm cream `oklch(0.99 0.008 80)` — approximately `#FFFDF8`
- **Muted backgrounds**: `bg-muted/35`, `bg-muted/50` variants
- **Cards**: White `#FFFFFF` with `ring-1 ring-foreground/10`

### Issues
- No refined shade scale (no 50/100/200/.../900 variants)
- Primary and secondary sometimes used together on large areas (creates visual noise)
- Semantic colors (success/warning/error) not defined — components use inline hex
- Border colors use `oklch(0.922 0 0)` directly rather than a token
- Focus ring color not consistently defined

---

## 3. Spacing & Layout

### Current State
- Max content width: `1180px` (public) / `1280px` (admin max-w-7xl)
- Section padding: `py-16` / `py-24` / `py-32` — inconsistent
- Card padding: `p-5` (20px) or `p-6` (24px) — mixed
- Grid gaps: `gap-6` standard

### Issues
- No consistent spacing grid documented
- Page padding differs between public pages
- Admin pages use `p-4 sm:p-6 lg:p-8` — reasonable
- Some sections have excessive vertical padding

---

## 4. Border Radius

### Current State
- Default radius: `0.625rem` (10px)
- Cards: `rounded-xl` (~12px with current scale)
- Buttons: `rounded-lg` (~10px with current scale)
- Badges: `rounded-full`
- Inputs: `rounded-lg`

### Issues
- Radius values are inconsistent between component types
- Some radii too large for a guest house (should feel warm but not cartoonish)

---

## 5. Shadows

### Current State
- Custom shadows: `shadow-[0_28px_80px_-48px_rgba(8,63,115,.55)]` — hardcoded
- Cards use `ring-1 ring-foreground/10` (shadcn default)
- Some elements use no shadow at all

### Issues
- Hardcoded shadow values — not tokenized
- Heavy shadows on hero section feel SaaS-like, not hospitality
- Card elevation inconsistent

---

## 6. Images

### Current State
- Hero uses a generic collage-style image (`inspiration-1.jpeg`)
- Room cards use actual R2 images when available, fallback to collage
- Image aspect ratios: `4/3` on cards, `16/9` on detail page
- `next/image` used with proper `fill` and `sizes` attributes

### Issues
- Browser audit noted the collage imagery feels "amateur" and "crowded"
- Fallback image is not branded
- Room detail gallery limited to 3 images max

---

## 7. Public Website — Specific Issues

### Header
- Navigation spacing adequate but could be tighter
- Mobile menu: simple toggle with absolute positioning — functional but basic
- "Book a stay" CTA could be more prominent
- Location strip on mobile is an afterthought

### Homepage
- Hero headline "Stay easy. Feel at home." — good copy but huge font size (`clamp(3.5rem,8vw,7rem)`)
- Hero image is the generic collage — needs real guest house photos
- Availability search card below hero — functional but plain presentation
- Room cards: good structure but image quality issues
- Breakfast section: clean but lacks visual interest
- Conference section: text-heavy, no images
- Footer: good information but could be more compact

### Room Listing
- Page layout is clean
- Search/filter is minimal (no room type filter, no price filter)
- Cards are well-structured but image quality issues
- No loading skeleton — flash of content

### Room Details
- Image gallery layout is reasonable
- Booking form: comprehensive but date inputs are plain HTML date pickers
- Amenities display uses rotating icons (Wifi, Coffee, Bath) — hacky
- "Good to know" section: clean
- Sticky booking card on desktop: good pattern

### Contact Page
- Clean, minimal, effective
- Could use a map embed or better location context

### Booking Form
- Comprehensive fields but no client-side validation beyond HTML5
- No date range picker — two separate date inputs
- No guest count validation against room capacity
- Success state works but plain

---

## 8. Admin Dashboard — Specific Issues

### Layout
- Sidebar: 240px, solid background, scrollable — functional but basic
- No active state indicator (like a left accent bar)
- Mobile sidebar: horizontal scroll instead of drawer pattern
- Top bar: shows name and role — minimal

### Overview
- Metric cards: functional but plain — no icons, no trends
- Recent bookings table: basic but adequate
- Pagination: none on overview

### Rooms Management
- Table: minimal styling but functional
- Status badges: use `Badge` component
- Edit form: well-structured, multi-section form
- Image uploader: functional with previews and delete

### Booking Management
- Table: comprehensive columns but no search/filter
- Status select: dropdown with valid transitions — well-implemented
- No mobile-optimized view

### Customers
- Search form: functional
- Table: comprehensive
- Duplicate detection: well-implemented
- Pagination: present

### Other Admin Pages
- Settings: simple form list — functional
- Follow-ups: comprehensive form
- Documents: basic
- Reports: not checked in detail

---

## 9. Accessibility Issues

- Some interactive elements lack visible focus states
- Date inputs flagged as invalid in accessibility tree (browser audit)
- Status badges rely on color (`capitalize` class) — need text indicators
- Mobile menu toggle needs `aria-controls` on panel
- Some icons used without `aria-label` or `sr-only` text
- `prefers-reduced-motion` not explicitly handled

---

## 10. Performance Observations

- Two font families loaded (Inter + Inter Tight) — 4-6 font files
- Framer Motion is installed but used minimally — could be used more effectively
- All public pages use `dynamic = "force-dynamic"` — no ISR caching
- Images use proper `next/image` with `sizes`
- No layout shift issues observed
