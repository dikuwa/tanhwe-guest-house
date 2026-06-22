# File: CODER_RULES.md

# Coder Rules

These rules are strict.

## Documentation First

The coder must read all documentation before coding.

## No Unauthorized Changes

Do not change:

- project scope
- design direction
- role permissions
- database relationships
- booking workflow
- invoice calculation logic

without updating documentation and getting approval.

## No Hardcoded Business Content

The following must be editable from dashboard/settings where appropriate:

- room names
- room prices
- room descriptions
- room images
- amenities
- guest house contact
- WhatsApp number
- check-in/check-out times
- breakfast setting
- quote/receipt settings

## Role Rules

Owner-only financial information must not be visible to staff.

Permissions must be enforced server-side, not only in the UI.

## Booking Rules

Availability must check overlapping dates and available units.

Do not allow confirmed bookings to exceed available units.

## Document Rules

Quotes and receipts must use accurate calculations.

Formula:

`price_per_night × rooms_count × nights + extras - discounts`

Payments reduce balance due.

Paid in full must not display incorrect balance due.

## UI Rules

Follow `DESIGN_RULES.md`.

Do not introduce AI slop.

Use shadcn/ui, Lucide React, Sonner, and Framer Motion consistently.

## Testing Rules

Every completed phase must be tested before moving to the next phase.

Do not deploy until QA checklist is complete.
