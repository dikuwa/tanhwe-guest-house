# File: 09-deployment-guide.md

# Deployment Guide

## Environment Variables

Required examples:

```env
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SITE_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
AUTH_SECRET=
SENTRY_DSN=
```

If using Better Auth, include required Better Auth environment variables.

## Hosting

Recommended:

- Vercel

## Database

Recommended:

- Neon PostgreSQL (`DATABASE_URL` pooled; `DIRECT_URL` direct)

## Storage

Recommended:

- Cloudflare R2 with a production custom domain

Buckets:

- room-images
- document-pdfs

## Email

Recommended:

- Resend

Email templates:

- Booking request received
- Booking confirmed
- Quote sent
- Receipt sent
- Payment reminder
- Arrival reminder

## Domain Setup

- Add production domain to Vercel
- Configure DNS
- Add domain to email provider if sending branded emails

## Backup Strategy

- Configure Neon restore/backup retention appropriate to the plan
- Configure R2 object lifecycle rules where appropriate
- Export bookings/customers monthly if on free tier
- Keep PDF documents backed up

## Monitoring

Recommended:

- Sentry for errors
- PostHog for usage analytics

## Pre-Launch Checklist

- [ ] Production env variables added
- [ ] Owner account created
- [ ] Email sending tested
- [ ] PDF download tested
- [ ] WhatsApp links tested
- [ ] Mobile tested
- [ ] Role permissions tested
- [ ] Database backup plan confirmed
