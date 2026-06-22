# File: 04-architecture.md

# Tanhwe Guest House — Architecture

## Recommended Stack

This project should remain lightweight.

Recommended stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Framer Motion
- Sonner
- React Hook Form
- Zod
- TanStack Table
- TanStack Query
- Neon PostgreSQL
- Cloudflare R2
- Better Auth
- Drizzle
- Resend
- React PDF
- Vercel
- Sentry
- PostHog optional

## Stack Decision

### Frontend

Use Next.js with TypeScript.

Reason:

- Works well on Vercel
- Good for public pages and admin dashboard
- Supports server actions/API routes
- Familiar from Desert Tech and Martin Mukoya projects

### UI

Use shadcn/ui, Lucide React, Framer Motion, and Sonner.

Reason:

- Consistent with Desert Tech/Martin Mukoya workflow
- Fast to build
- Easy to style
- Professional UI foundation

### Database

Use PostgreSQL through Neon.

Reason:

- Simple setup
- Managed serverless PostgreSQL with pooled runtime connections
- Suitable for a small guest house
- Can scale later

### Auth

Use Better Auth with database-backed sessions and server-side owner/admin/staff authorization.

### ORM

Use Drizzle for schema definitions, migrations, and queries.

### Storage

Use Cloudflare R2 with an S3-compatible server client and a public custom domain.

Reason:

- Room images only
- Not heavy media
- Credentials remain server-only
- Public delivery is separated from write access
- Room images receive immutable cache headers

### Email

Use Resend.

Use for:

- Booking received
- Booking confirmed
- Payment reminders
- Quote/receipt emails
- Admin notifications

### PDF

Use React PDF or server-side PDF rendering.

PDFs required:

- Quotes
- Receipts
- Invoices

### Hosting

Use Vercel.

Reason:

- Lightweight
- Easy deployment
- Good for Next.js

### Docker

Docker is optional for MVP.

Use Docker if:

- Self-hosting
- Coolify deployment
- Local reproducible dev setup
- More complex background jobs

For this project, Docker Compose is not needed for the managed Neon deployment.

## Security

- Role-based access
- Owner-only financial data
- Protected admin routes
- Strong validation with Zod
- Rate limit booking form
- Prevent public access to admin data
- Audit important actions
- Secure uploaded files
