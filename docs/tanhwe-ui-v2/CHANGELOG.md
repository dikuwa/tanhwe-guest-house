# Tanhwe UI v2 — Changelog

> UI/UX update using VibeKit design principles (June 23, 2026)

---

## Design System Changes

### Typography
- **Body font**: Switched from Inter to **Onest** (Google Fonts) — cleaner geometric sans with crisp numerals
- **Heading font**: Preserved **Inter Tight** for visual continuity with existing brand
- Removed 2 font files from critical path (Inter regular/italic no longer loaded)
- Established a complete type scale with defined sizes, weights, and line-heights

### Colors
- Refined neutral palette with warm sand tones (`neutral-50` through `neutral-900`)
- Cards use `#FFFFFF` / `#FFFDF8` backgrounds with `neutral-200` borders
- Semantic status colors defined for booking states (pending, confirmed, checked-in, etc.)
- Removed hardcoded shadow values — all shadows tokenized via `@theme`

### Spacing & Layout
- Standardised card padding to `p-6` (24px)
- Consistent section spacing: `py-16 sm:py-20 lg:py-24`
- Admin sidebar: 240px with refined spacing
- All forms use consistent `h-10` input heights

### Radius & Shadows
- Refined radius scale: `sm`=6px, default=8px, `md`=10px, `lg`=12px, `xl`=16px
- Tokenized shadow scale using warm-tinted `rgba(34, 31, 25, ...)` values
- Cards use `shadow-xs` + border — subtle, not heavy

### Animations
- Added `animate-shimmer` for loading skeletons
- Added `animate-fade-in` for menu transitions
- Mobile menu now has backdrop blur and scroll lock

---

## Public Website Changes

### Header & Navigation
- Desktop nav: tighter spacing (gap-6), active indicator dot on current page
- Mobile nav: full backdrop blur overlay, click-to-close outside, scroll lock when open
- Header height reduced to `h-14` on mobile, `h-16` on desktop
- Call button changed from outline to ghost variant for cleaner look

### Homepage
- Refined hero: removed oversized `clamp()` font, used `text-5xl/6xl/7xl` breaking
- Hero shadow replaced `shadow-[hardcoded]` with `shadow-lg`
- "Our promise" card: white background with border + backdrop blur (was solid secondary)
- Availability search: consistent `h-10` inputs, better grid layout
- Backgrounds use `bg-neutral-50` instead of colored mixes

### Room Cards
- Added `shadow-xs transition-shadow hover:shadow-sm` for interactive feel
- Badge refined with `bg-background/90 backdrop-blur-sm`
- Price uses `tabular-nums` for number alignment
- "View room" button now includes arrow icon

### Room Details
- Booking form: fieldset grouping with "Stay details" / "Contact details" legends
- Price summary shows "Total estimate" with nights × rooms breakdown
- Error states use proper destructive tokens
- Success state: icon in rounded circle, reference number in bordered box

### Booking Form
- Grouped fields into logical fieldsets with uppercase labels
- Better price summary layout with border separator
- Consistent `h-10` input heights
- Improved mobile layout

### Contact Page
- Header section: uppercase eyebrow label
- Content: white card with border+shadow for location info
- Better vertical rhythm and spacing
- Refined typography scale

---

## Admin Dashboard Changes

### Layout
- Background: `bg-neutral-50` (warm light gray)
- Sidebar: white background, refined active state with left accent bar
- Top bar: reduced to `h-14`, added avatar initial circle
- Cards: white background with `border-neutral-200 shadow-xs`

### Navigation
- Active state: left 2px accent bar + `bg-primary/10` background
- Hover: `bg-neutral-100` with proper text contrast
- Sign out button in bottom section (separated by border)
- Tighter spacing: `p-2` instead of `p-3`

### Dashboard Overview
- Metric cards: refined with neutral-500 labels, neutral-700 text
- Better status badge variants per status type
- Empty state: descriptive text "No bookings yet. Create your first booking..."
- Table rows: hover state with `bg-neutral-50`

### Rooms Management
- Table header: `bg-neutral-50`, `font-semibold`, uppercase
- Empty state includes icon + description
- Edit form: white card sections with consistent styling

### Bookings Management
- Status badge maps for semantic coloring
- Payment badge maps for semantic coloring
- Empty state with icon
- Better date range formatting

### Customers
- Form: white card with consistent tokens

### Settings
- White card with `divide-neutral-100` dividers
- Consistent input heights

### Other Admin Forms
- Follow-ups, Documents, Payments: all updated to use `bg-white border-neutral-200 shadow-xs`

---

## Login Page
- Removed gradient background (was `from-orange-50 via-white to-blue-50`)
- Clean centered card on `bg-neutral-50`
- Refined card with border + shadow
- Better loading state text

---

## Files Changed

### Core
- `app/globals.css` — Design tokens, Onest font, shadows, animations
- `app/layout.tsx` — Onest font import, updated description

### Public Components
- `components/public/site-header.tsx` — Refined layout, ghost call button
- `components/public/site-navigation.tsx` — Better mobile menu, backdrop, active indicator
- `components/public/site-footer.tsx` — Compact spacing, uppercase section labels
- `components/public/room-card.tsx` — Shadow, tabular-nums, badge refinement
- `components/public/booking-request-form.tsx` — Fieldset grouping, refined success/error states
- `components/public/availability-search.tsx` — Consistent height, better grid
- `components/public/contact-actions.tsx` — Consistent icon sizing

### Public Pages
- `app/page.tsx` — Refined hero, shadow, badge
- `app/rooms/page.tsx` — Minor styling pass
- `app/rooms/[slug]/page.tsx` — Minor styling pass
- `app/contact/page.tsx` — Refined layout, white card location section

### Admin Components
- `app/admin/layout.tsx` — Neutral background, refined sidebar, avatar in topbar
- `components/admin/admin-nav.tsx` — Active accent bar, refined hover states
- `app/admin/page.tsx` — Metric cards, refined table, better empty state
- `app/admin/rooms/page.tsx` — Refined table, empty state with icon
- `app/admin/bookings/page.tsx` — Status badge maps, empty state
- `app/admin/bookings/new/page.tsx` — Refined layout
- `app/admin/settings/page.tsx` — Refined layout
- `app/login/page.tsx` — Clean card on neutral background
- `components/admin/room-form.tsx` — White card sections
- `components/admin/booking-form.tsx` — White card, consistent selects
- `components/admin/customer-form.tsx` — White card, refined message
- `components/admin/settings-form.tsx` — White card, consistent styling
- `components/admin/follow-up-form.tsx` — White card, refined selects
- `components/admin/payment-form.tsx` — White card, refined form
- `components/admin/document-form.tsx` — White card, refined form

### Documentation
- `docs/references/vibekit/README.md` — VibeKit reference adoption decisions
- `docs/tanhwe-ui-v2/current-ui-audit.md` — Comprehensive UI audit
- `docs/tanhwe-ui-v2/design-style-guide.md` — Complete design system
- `docs/tanhwe-ui-v2/component-plan.md` — Component plan
- `docs/tanhwe-ui-v2/CHANGELOG.md` — This file

---

## Dependencies

### Changed
- Added `@fontsource/onest` — installed for Onest font (loaded via `next/font/google`)

### Unchanged
- All existing production dependencies preserved
- No new major libraries added
- No services added or removed

---

## Architecture Preservation
- ✅ Next.js App Router — unchanged
- ✅ TypeScript — no config changes
- ✅ Neon PostgreSQL + Drizzle ORM — unchanged
- ✅ Better Auth — unchanged
- ✅ Cloudflare R2 — unchanged
- ✅ All API routes — unchanged
- ✅ All database schema — unchanged
- ✅ All business logic — unchanged
- ✅ All environment variables — unchanged
- ✅ All role-based access — unchanged
- ✅ Booking status transitions — unchanged
- ✅ Overbooking protection — unchanged
