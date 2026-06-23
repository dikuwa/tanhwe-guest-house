# Testing plan

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run `npm run verify:phase5` against a disposable Neon branch after applying migrations. Verify owner, admin, and staff direct URL/API access; room create/edit/images; available, partial, blocked, and fully booked dates; public/manual bookings; duplicate customer review; snapshot totals; payment balance transitions; PDF generation; reminder idempotency; reports; keyboard navigation; focus; reduced motion; mobile/tablet/desktop overflow; and empty/error/success states.

Production smoke checks must use non-destructive test records and remove them afterward through normal application behavior.
