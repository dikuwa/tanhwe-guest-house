# Architecture

Public and admin pages live in the App Router. Server Components read through `lib/public-data.ts` and `lib/admin-data.ts`. Route handlers validate mutations with Zod, authorize sessions with `lib/auth-middleware.ts`, and write through lazy `getDb()` initialization. Better Auth uses the existing Drizzle tables. Availability and overbooking rules remain centralized in `lib/availability.ts`.

R2 uses a lazily initialized S3 client. New image URLs use `R2_PUBLIC_URL`; deletion and Next Image may also accept `R2_LEGACY_PUBLIC_URL` during a custom-domain transition.

V2 adds no new provider. An additive migration adds document snapshots/balances, customer lookup indexes, and idempotent reminder logs. Vercel Cron calls a protected route daily to create internal follow-up tasks.
