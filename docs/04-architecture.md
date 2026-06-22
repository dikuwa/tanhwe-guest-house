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
- Supabase PostgreSQL
- Supabase Storage
- Better Auth or Supabase Auth
- Prisma or Drizzle
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

Use PostgreSQL through Supabase.

Reason:

- Simple setup
- Auth/storage/database in one ecosystem
- Suitable for a small guest house
- Can scale later

### Auth

Choose between:

#### Option A: Supabase Auth

Best if simplicity is the priority.

#### Option B: Better Auth

Best if long-term flexibility and custom role logic are priorities.

Recommendation:

Use **Better Auth + PostgreSQL** if the coder is comfortable with it.

Use **Supabase Auth** if speed and simplicity are more important.

### ORM

Use Prisma or Drizzle.

Recommendation:

Use Prisma if the developer prefers mature tooling and readable schema.

Use Drizzle if the developer wants lighter TypeScript-first control.

### Storage

Use Supabase Storage.

Reason:

- Room images only
- Not heavy media
- No need for Cloudflare R2 at MVP stage

Use Cloudflare R2 only if:

- Many large images
- High traffic
- Need cheaper object storage at scale

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

For this project, include Docker Compose only if the coder chooses local PostgreSQL instead of Supabase.

## Security

- Role-based access
- Owner-only financial data
- Protected admin routes
- Strong validation with Zod
- Rate limit booking form
- Prevent public access to admin data
- Audit important actions
- Secure uploaded files
