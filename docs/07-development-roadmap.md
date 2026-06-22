# File: 07-development-roadmap.md

# Development Roadmap

## Phase 1 — Project Setup

Goal:

Set up app foundation.

Tasks:

- Create Next.js app
- Add TypeScript
- Add Tailwind
- Install shadcn/ui
- Install Lucide React
- Install Framer Motion
- Install Sonner
- Configure formatting/linting
- Add base layout

Completion:

- App runs locally
- Base theme tokens added
- Public/admin route structure exists

## Phase 2 — Auth and Roles

Tasks:

- Configure auth
- Add owner/admin/staff roles
- Protect admin routes
- Add role checks
- Create login page

Completion:

- Owner/admin/staff can login
- Staff cannot access owner-only pages

## Phase 3 — Database and Storage

Tasks:

- Create database schema
- Configure storage
- Add room image upload
- Add seed owner account if needed

Completion:

- Tables created
- Images upload correctly
- Permissions tested

## Phase 4 — Public Website

Tasks:

- Homepage
- Rooms page
- Room detail page
- Booking widget
- WhatsApp/call CTAs
- Contact page

Completion:

- Customer can browse rooms and submit booking request

## Phase 5 — Admin Rooms and Bookings

Tasks:

- Room CRUD
- Booking table
- Booking status updates
- Availability logic
- Manual booking creation

Completion:

- Admin can manage rooms and bookings

## Phase 6 — Customers and Follow-ups

Tasks:

- Customer records
- Follow-up tasks
- Reminder queue

Completion:

- Admin can track guest communication

## Phase 7 — Documents and Payments

Tasks:

- Quote generation
- Receipt generation
- Invoice calculations
- Payment records
- PDF download/share

Completion:

- Documents calculate totals correctly

## Phase 8 — Reports and Owner Tools

Tasks:

- Owner financial summary
- Occupancy stats
- Activity logs
- Settings

Completion:

- Owner sees restricted financial view

## Phase 9 — QA and Deployment

Tasks:

- Test all workflows
- Mobile testing
- Security testing
- Deploy to Vercel
- Configure domain/email

Completion:

- Production-ready
