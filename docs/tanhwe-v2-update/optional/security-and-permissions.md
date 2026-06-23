# Security and permissions

Owner: full operations, documents/payments, reports, settings, users, and roles. Admin: rooms, bookings, customers, documents/payments, and follow-ups. Staff: dashboard, booking status operations, customer operational details, and assigned follow-up completion; no owner reports, documents, settings, users, or room administration. All restrictions are enforced server-side in pages and route handlers.

R2 credentials remain server-only. Uploads validate size, declared MIME, file signature, room existence, and count. PDF responses are authenticated, private, and not cached.
