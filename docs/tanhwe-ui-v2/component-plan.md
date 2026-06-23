# Tanhwe UI Update — Component Plan

## Approach

1. **Refine existing components** — improve styling, spacing, accessibility of current components
2. **No new major libraries** — use existing shadcn/ui + Tailwind + Lucide
3. **Design tokens in globals.css** — colors, shadows, radius via `@theme`
4. **Mobile-first** — every component tested at 375px

---

## Component Inventory

### Public Components (Refine)

| Component | File | Changes |
|-----------|------|---------|
| SiteHeader | `components/public/site-header.tsx` | Tighter spacing, better mobile menu, improved CTA hierarchy, keyboard accessibility |
| SiteNavigation | `components/public/site-navigation.tsx` | Better mobile drawer, focus states, aria attributes |
| SiteFooter | `components/public/site-footer.tsx` | Compact spacing, cleaner layout |
| RoomCard | `components/public/room-card.tsx` | Better image treatment, refined typography, hover states |
| AvailabilitySearch | `components/public/availability-search.tsx` | Cleaner form layout, better date UX |
| BookingRequestForm | `components/public/booking-request-form.tsx` | Better validation feedback, improved success state, mobile sticky CTA |
| ContactActions | `components/public/contact-actions.tsx` | Consistent icon sizing, better spacing |

### Public Pages (Refine)

| Page | File | Changes |
|------|------|---------|
| Homepage | `app/page.tsx` | Refined hero, improved room cards section, better breakfast/conference sections |
| Room Listing | `app/rooms/page.tsx` | Better header, refined card grid, loading state |
| Room Detail | `app/rooms/[slug]/page.tsx` | Better image gallery, refined booking sidebar, sticky mobile action |
| Contact | `app/contact/page.tsx` | Refined layout, better location card |

### Admin Components (Refine)

| Component | File | Changes |
|-----------|------|---------|
| AdminNav | `components/admin/admin-nav.tsx` | Active state with left accent bar, compact spacing, mobile drawer |
| BookingForm | `components/admin/booking-form.tsx` | Refined form layout, better select styling |
| BookingStatus | `components/admin/booking-status.tsx` | Badge-based status display |
| RoomForm | `components/admin/room-form.tsx` | Better section grouping, refined fields |
| CustomerForm | `components/admin/customer-form.tsx` | Refined layout |
| FollowUpForm | `components/admin/follow-up-form.tsx` | Better grid layout |
| DocumentForm | `components/admin/document-form.tsx` | Refined inline form |
| SettingsForm | `components/admin/settings-form.tsx` | Better row layout |
| PaymentForm | `components/admin/payment-form.tsx` | Refined inline form |
| ImageUploader | `components/image-uploader.tsx` | Better drop zone, progress feedback |

### Admin Pages (Refine)

| Page | File | Changes |
|------|------|---------|
| Admin Layout | `app/admin/layout.tsx` | Better sidebar, top bar with branding |
| Dashboard Overview | `app/admin/page.tsx` | Better metric cards, refined table |
| Rooms List | `app/admin/rooms/page.tsx` | Better table, status badges |
| Bookings List | `app/admin/bookings/page.tsx` | Search/filter, refined table |
| New Booking | `app/admin/bookings/new/page.tsx` | Refined layout |
| Customers List | `app/admin/customers/page.tsx` | Better table, search |
| Settings | `app/admin/settings/page.tsx` | Refined layout |

### Shared UI Components (Refine)

| Component | File | Changes |
|-----------|------|---------|
| Button | `components/ui/button.tsx` | Refined variants, sizes |
| Card | `components/ui/card.tsx` | Token-based styling |
| Input | `components/ui/input.tsx` | Better focus states |
| Badge | `components/ui/badge.tsx` | Status variants |
| Global CSS | `app/globals.css` | Design tokens, typography, shadows, radius |

### Removed (Unused)
- None — preserving all existing components

---

## Design Token Changes

### Colors (globals.css `@theme`)
- **Refined primary scale**: orange with 50/100/200/.../900 shades
- **Refined secondary scale**: blue with same pattern
- **Semantic colors**: success, warning, error, info (50 + 600 variants)
- **Warm neutrals**: kept existing cream base, refined border/muted/input values

### Typography (globals.css)
- **Body font**: Onest (replaces Inter for body)
- **Heading font**: Inter Tight (kept, already loaded)
- **Complete type scale**: display, h1-h4, body, caption, micro, tabular

### Shadows
- Tokenized: `shadow-xs` through `shadow-xl` using warm-tinted neutrals
- Cards use `shadow-xs` + border — not heavy shadows

### Radius
- Refined: `sm`=6px, default=8px, `md`=10px, `lg`=12px, `xl`=16px
- Applied consistently across components

### Spacing
- 8px grid through Tailwind spacing utilities
- Consistent section spacing: `py-16 sm:py-20 lg:py-24`
- Card padding standardised to `p-6`
