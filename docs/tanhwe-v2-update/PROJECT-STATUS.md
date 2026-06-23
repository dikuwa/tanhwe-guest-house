# Project status

Status: V2 is merged to `main` and deployed to production. The additive migration, authenticated Phase 5/V2 production verification, PDF verification, and route smoke tests have passed. UI polish and visual browser QA remain deferred by owner request.

Implemented: preserved Phase 5 public/admin operations; updated design tokens and Inter Tight/Inter typography; accessible mobile navigation; room gallery; customer management and duplicate review; snapshot quotes/invoices/receipts; PDF downloads; payments and balances; follow-ups; idempotent scheduled task creation; owner reports; settings; role management; R2 legacy-domain compatibility; updated docs.

Not claimed complete: a live backup restore drill, Resend sender-domain confirmation, Cloudflare custom-domain configuration, credential rotation, and owner confirmation of real room content.

Local verification on 2026-06-23: TypeScript passed, ESLint passed with no warnings, 4/4 unit tests passed, the production build passed, sample PDF generation returned a valid PDF signature, public runtime routes returned 200, and the protected admin route redirected to login. The in-app visual browser was unavailable. `npm audit` reports six moderate transitive advisories in current latest Next.js/Drizzle tooling; its only suggested remediation is a breaking downgrade, so no unsafe automatic fix was applied.

Production verification on 2026-06-23: deployment `dpl_C2s8uP3rnMEfat8cekasMh3YuDAi` reached Ready at `https://tanhweguesthouse.vercel.app`; migration `0001` applied successfully; authenticated Phase 5 and V2 workflows passed; all temporary verification data was removed. Vercel Web Analytics and Speed Insights instrumentation were added for the next deployment.

Permission verification on 2026-06-23: temporary admin and staff accounts confirmed allowed and denied page/API behavior for rooms, bookings, customers, documents, follow-ups, reports, settings, and users. The temporary accounts and sessions were removed; production retains only the owner account.

Reminder verification on 2026-06-23: `CRON_SECRET` was added to production, the first cron run created arrival and balance tasks for a temporary imminent booking, the second created zero duplicates, and all verification data was removed.
