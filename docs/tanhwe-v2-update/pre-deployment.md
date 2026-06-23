# Pre-deployment checklist

- [ ] Review and apply migration `0001_cheerful_sebastian_shaw.sql` on a Neon branch.
- [ ] Confirm real room rates, inventory, descriptions, and images.
- [x] Run local lint, typecheck, unit tests, production build, PDF smoke test, and public route smoke test.
- [ ] Run authenticated Phase 5/V2 verification against a disposable Neon branch.
- [ ] Verify all three roles by page and API.
- [ ] Test a quote, invoice, payment, receipt, and PDF.
- [ ] Invoke the cron route twice and confirm no duplicate tasks.
- [ ] Configure preview environment variables and deploy a Vercel preview.
- [ ] Complete mobile and desktop browser smoke tests.
- [ ] Configure monitoring and database/R2 backup procedures.
- [ ] Rotate production credentials and owner password.
- [ ] Configure the R2 custom domain, retaining the legacy URL during transition.
- [ ] Record rollback steps and migration backup point.
