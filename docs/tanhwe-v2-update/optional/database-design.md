# Database design

The authoritative model is `lib/db/schema.ts`. Core entities are users/sessions/accounts, rooms/images/amenities/blocked dates, customers, bookings/booking rooms, payments, documents, follow-ups/reminder logs, settings, and activity logs. Booking rooms and documents retain price snapshots. Financial integers follow the established whole-NAD convention. Migration `0001` is additive and its rollback removes only newly added indexes, reminder logs, and document snapshot/balance columns after confirming no V2 data is needed.
