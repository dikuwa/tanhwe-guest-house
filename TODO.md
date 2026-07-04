# TODO - Booking Folio / Services / Extras / Discounts (Line-item persistence)

## Schema + migration

- [ ] Add new DB tables to `lib/db/schema.ts`:
  - [x] `booking_folio_lines` (linked to `bookings`)
  - [ ] (optional) `folio_items` / catalog
- [x] Write drizzle migration SQL in `drizzle/`.

## Backend wiring

- [ ] Extend booking create/edit APIs to accept folio lines (service/custom, qty, unit price)
- [ ] Recalculate and persist `bookings.extrasTotal`, `bookings.discount`, `bookings.total`, `balanceDue` from folio lines
- [ ] Ensure `refreshMutableBookingDocuments` includes folio line items in `documents.snapshot`

## Document preview + PDF

- [ ] Update `app/admin/documents/[id]/page.tsx` to render folio line items individually
- [ ] Update `lib/document-pdf.tsx` to render folio line items individually

## Admin UI

- [ ] Update `components/admin/edit-booking-form.tsx` to manage folio lines:
  - [ ] add service/custom item, qty, unit price
  - [ ] add discount line(s)
  - [ ] edit/remove before saving

## Tests / validation

- [ ] Run `npm test`
- [ ] Run `npm run lint`
- [ ] Run `npm run db:migrate` (requires DB env vars)
