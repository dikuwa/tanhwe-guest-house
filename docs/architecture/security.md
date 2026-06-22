# File: architecture/security.md

# Security Specification

## Roles

- Owner
- Admin
- Staff

## Access Rules

Owner:

- Full access
- Financial records
- User management
- Settings
- Activity logs

Admin:

- Bookings
- Rooms
- Customers
- Documents
- Follow-ups

Staff:

- View bookings
- Update operational statuses
- Add notes
- No financial reports
- No user management

## Required Security

- Protect all `/admin` routes
- Server-side role checks
- Zod validation
- Rate limiting on public booking forms
- Audit logs for financial and booking actions
- Secure file uploads
- Prevent staff from accessing owner reports
- Never trust client-side permissions only
