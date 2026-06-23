# File: 01-prd.md

# Tanhwe Guest House — Product Requirements Document

## Executive Summary

Tanhwe Guest House needs a modern, lightweight web app for showcasing rooms, accepting booking requests, checking room availability, and managing bookings from an internal dashboard.

The system must allow the owner/admin to manage rooms, pricing, customers, bookings, receipts, quotes, payments, and follow-ups without manually editing code.

## Success Criteria

The project is successful when:

- Customers can easily find rooms and request bookings
- Room availability prevents double booking
- Admin can manage rooms and pricing from the dashboard
- Owner can generate quotes and receipts
- Invoice calculations correctly include price, rooms, and nights
- Owner can view financial records
- Staff access is restricted
- WhatsApp and call workflows are smooth
- The UI feels polished, not AI-generated
- The app remains simple and handover-friendly

## User Stories

### Customer

As a customer, I want to:

- View available rooms
- See prices clearly
- Select check-in and check-out dates
- Enter guest details
- Send a booking request
- Contact the guest house by WhatsApp or phone
- Receive confirmation or follow-up

### Owner

As the owner, I want to:

- Add, edit, delete, and update rooms
- Set prices
- View bookings
- View financial summaries
- Generate receipts and quotes
- Manage users
- View client records
- Track payments
- See activity logs

### Admin

As an admin, I want to:

- Manage bookings
- Follow up guests
- Generate documents
- Update room availability
- Manage customer records

### Staff

As staff, I want to:

- See upcoming check-ins
- See upcoming check-outs
- Update booking status
- Add notes
- Avoid seeing restricted financial reports

## Functional Requirements

### Public Website

- Homepage
- Rooms listing
- Room details page
- Booking enquiry form
- Availability search
- Gallery
- Facilities section
- Conference facilities section
- Contact section
- WhatsApp and call buttons

### Room Management

Admin/owner can:

- Create room
- Edit room
- Delete room
- Upload images
- Set room type
- Set price per night
- Set number of available units
- Set max guests
- Add amenities
- Set room status
- Block unavailable dates

### Availability

System must check:

- Check-in date
- Check-out date
- Existing confirmed bookings
- Admin blocked dates
- Number of units available
- Maintenance status

### Booking Management

Admin can:

- View all bookings
- Create manual booking
- Confirm booking
- Cancel booking
- Mark no-show
- Mark checked-in
- Mark checked-out
- Add internal notes
- Assign booking source

### Customer Management

Admin can:

- Add customers
- Edit customer details
- View booking history
- Add notes
- Search customers

### Documents

System must generate:

- Quotes
- Receipts
- Invoices

Documents must calculate:

- Room price
- Number of rooms
- Number of nights
- Extras
- Discounts
- Deposit paid
- Balance due
- Total

### Follow-ups

System should support:

- Manual follow-up tasks
- Booking reminders
- Arrival reminders
- Payment reminders
- Post-checkout follow-up

### User Roles

- Owner
- Admin
- Staff

Role permissions must be enforced.

## Non-Functional Requirements

- Mobile responsive
- Fast loading
- Secure authentication
- Role-based access
- Accessible UI
- Clean admin experience
- No hardcoded room/pricing content
- Easy deployment
- Low hosting cost
- Good error handling
- Proper backups

## Acceptance Criteria

- User can submit booking request
- Admin receives booking in dashboard
- Availability prevents overbooking
- Invoice total uses nights correctly
- Room content is dashboard-controlled
- Owner can see financial reports
- Staff cannot see restricted reports
- PDFs download correctly
- WhatsApp CTA opens with useful message
- Mobile UI is usable

## Future Scope

- Online deposits
- SMS notifications
- Channel manager integration
- Housekeeping
- Advanced reports
- Conference booking module
- Customer portal
