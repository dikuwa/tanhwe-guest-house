# Tanhwe V2 update

Start with `PROJECT-STATUS.md`, then read `current-system-audit.md`, `architecture.md`, and `pre-deployment.md`. The application remains a Next.js 16 App Router project backed by Neon PostgreSQL, Drizzle ORM, Better Auth, and Cloudflare R2. Legacy planning documents are retained in `docs/legacy-v1/` and are historical context, not implementation truth.

Money is stored as whole Namibia Dollars in integer columns, preserving the established production convention and avoiding floating-point persistence. Documents snapshot booking values at issue time. Apply Drizzle migration `0001_cheerful_sebastian_shaw.sql` before enabling V2 document and reminder features.
