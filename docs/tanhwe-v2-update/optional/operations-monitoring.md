# Operations and monitoring

The application emits Vercel request/runtime logs and records business mutations in `activity_logs`. Vercel Web Analytics and Speed Insights are mounted in the root layout. Confirm both products are enabled for the project in the Vercel dashboard after deployment.

Operational checks:

- Review Vercel error logs after every production deployment.
- Monitor public route availability, booking request failures, PDF generation, and cron 401/500 responses.
- Review overdue follow-ups and reminder logs daily.
- Review Neon storage, compute, connection, and history-window settings monthly.
- Review R2 object growth and lifecycle settings monthly.
- Never log passwords, auth cookies, R2 keys, database URLs, document snapshots, or customer contact data.

If Sentry is later approved, add it only after confirming plan/cost and use the existing `SENTRY_DSN` placeholder. Do not send customer details in error payloads.
