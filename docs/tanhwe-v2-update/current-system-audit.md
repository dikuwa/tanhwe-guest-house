# Current system audit

## Verified implemented

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/Base UI primitives.
- Neon-compatible PostgreSQL through `postgres` and Drizzle ORM with generated migrations.
- Better Auth email/password sessions with owner, admin, and staff roles; server-side page and API checks.
- R2 upload, list, display, and delete with MIME, signature, size, room, and URL validation.
- Public home, room list, room detail/gallery, contact, availability check, and booking request routes.
- Admin dashboard, room CRUD/deactivation, images, bookings, status transitions, availability checks, and activity logs.
- V2 customer profiles/search/editing, duplicate review, documents/PDFs, payments, follow-ups, scheduled task creation, settings, users, and owner reports.

## Partial or externally dependent

- Email document/reminder delivery: environment placeholders exist, but Resend is not wired and no paid service was added.
- Automatic reminders create idempotent staff tasks; they do not send messages automatically.
- R2 custom domain: code supports current and legacy public bases; Cloudflare DNS configuration is manual.
- Monitoring, backup verification, preview deployment, credential rotation, and production smoke testing require owner/platform access.

## Outdated legacy claims

Legacy phase labels and draft schemas are superseded by current routes, `lib/db/schema.ts`, and Drizzle migrations. Placeholder statements for customers, documents, follow-ups, settings, and users are no longer current.
