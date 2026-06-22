# File: 09-deployment-guide.md

# Deployment Guide

## Environment Variables

Required examples:

```env
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
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

- Supabase PostgreSQL

## Storage

Recommended:

- Supabase Storage

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

- Enable Supabase backups if on paid plan
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
