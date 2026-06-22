# Database Setup Guide

## Prerequisites

- Neon PostgreSQL database
- Cloudflare R2 bucket for room image storage
- Node.js 20.9+

## Neon PostgreSQL Setup

1. Create project at https://neon.tech
2. Get your connection string from the Neon console
3. Update the `.env` file with your connection string

The connection string format:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Replace:
- `user` with your Neon database username
- `password` with your Neon database password
- `ep-xxx.us-east-2.aws.neon.tech` with your actual endpoint
- `neondb` with your database name (usually neondb)

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=your-secret-key-here
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=tanhwe-room-images
R2_PUBLIC_URL=https://images.example.com
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=use-a-unique-password-with-at-least-12-characters
```

## Database Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Migration

```bash
npm run db:generate
```

This creates SQL migration files in the `drizzle` directory.

### 3. Run Migration

```bash
npm run db:migrate
```

This applies the migration to your database.

### 4. Seed Database

```bash
npm run seed
```

This creates:
- Default roles (owner, admin, staff)
- Admin user
- Sample rooms (Double Room, Single Room, Executive Suite)
- Sample customer

The seed refuses missing or short owner passwords and never logs the password.

Create the R2 bucket in Cloudflare and grant an API token Object Read & Write access to that bucket only. Connect a custom public domain to the bucket for production and set it as `R2_PUBLIC_URL`. Upload credentials stay in server-only environment variables.

### 5. Verify Setup

Check that tables were created in your Neon console or run:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Should show all tables: roles, users, rooms, customers, bookings, etc.

## Troubleshooting

### Connection Issues

If you get connection errors:
- Verify DATABASE_URL format matches Neon connection string
- Check SSL mode is set to `require`
- Ensure your Neon project is active
- Verify database name is correct

### Migration Errors

If migrations fail:
- Drop and recreate database in Neon console
- Run `npm run db:generate` and `npm run db:migrate` again

### Seed Errors

If seed fails:
- Check ADMIN_EMAIL and ADMIN_PASSWORD in `.env`
- Verify database connection
- Check that tables exist before seeding

## Reset Database

To reset the database:

1. Go to Neon console → Database → Reset database
2. Run `npm run db:migrate`
3. Run `npm run seed`

## Database Schema

The database includes these main tables:

- `roles` - User roles (owner, admin, staff)
- `users` - User accounts
- `rooms` - Room information
- `room_images` - Room images
- `room_amenities` - Room amenities
- `room_blocked_dates` - Blocked dates for rooms
- `customers` - Customer information
- `bookings` - Booking records
- `booking_rooms` - Many-to-many relationship between bookings and rooms
- `payments` - Payment records
- `documents` - Quotes, receipts, invoices
- `follow_ups` - Follow-up tasks
- `activity_logs` - Activity tracking
- `settings` - Application settings
