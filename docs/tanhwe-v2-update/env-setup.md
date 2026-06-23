# Environment setup

Copy `.env.example` to `.env` and replace placeholders locally. Server-only variables are `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, all `R2_*` credentials, `RESEND_*`, `SENTRY_DSN`, admin seed credentials, and `CRON_SECRET`. `NEXT_PUBLIC_SITE_URL` is intentionally public and must match the active local, preview, or production origin.

Obtain database URLs from Neon, R2 values from Cloudflare, and deployment values from Vercel project settings. `R2_PUBLIC_URL` is the preferred public asset base. `R2_LEGACY_PUBLIC_URL` is optional compatibility during domain migration. Never commit actual values.
