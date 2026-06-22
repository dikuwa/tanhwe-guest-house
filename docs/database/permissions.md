# File: database/permissions.md

# Database Permissions

## Owner

Can read/write all tables.

## Admin

Can read/write:

- rooms
- room_images
- room_amenities
- room_blocked_dates
- customers
- bookings
- booking_rooms
- payments
- documents
- follow_ups

Cannot manage owner role or restricted financial reports unless allowed.

## Staff

Can read:

- rooms
- customers needed for assigned bookings
- bookings
- booking_rooms
- follow_ups

Can update:

- booking operational status
- follow-up notes
- check-in/check-out notes

Cannot read:

- full financial reports
- user management
- settings requiring owner access

## Public

Can read:

- active rooms
- active room images
- active amenities
- public settings

Can create:

- booking request only through validated server action/API
