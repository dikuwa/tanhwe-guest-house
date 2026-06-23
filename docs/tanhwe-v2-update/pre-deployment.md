# Pre-deployment checklist

- [x] Review and apply migration `0001_cheerful_sebastian_shaw.sql`.
- [ ] Confirm real room rates, inventory, descriptions, and images.
- [x] Run local lint, typecheck, unit tests, production build, PDF smoke test, and public route smoke test.
- [x] Run authenticated Phase 5 and V2 production verification with uniquely generated records and guaranteed cleanup.
- [x] Verify owner, temporary admin, and temporary staff page/API permissions; temporary accounts removed.
- [x] Test an invoice, partial payment, receipt, PDF, customer update, follow-up, and owner report.
- [ ] Invoke the cron route twice and confirm no duplicate tasks.
- [ ] Configure preview environment variables and deploy a Vercel preview.
- [ ] Complete mobile and desktop browser smoke tests.
- [x] Install Vercel Web Analytics and Speed Insights instrumentation and document database/R2 backup procedures.
- [ ] Rotate production credentials and owner password.
- [ ] Configure the R2 custom domain, retaining the legacy URL during transition.
- [x] Record rollback and restore procedures.
