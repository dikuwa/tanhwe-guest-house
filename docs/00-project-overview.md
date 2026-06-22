# File: 00-project-overview.md

# Tanhwe Guest House — Project Overview

## Business Overview

Tanhwe Guest House is a guest accommodation and conference facility business based in Mukwe, Namibia.

The public brand message is:

**Comfort • Hospitality • Convenience**

Current public information from the poster:

- Business name: Tanhwe Guest House
- Location: Mukwe
- Contact: +264 81 380 8097
- Services:
  - Comfortable accommodation
  - Conference facilities
  - Breakfast included
- Existing advertised pricing:
  - Double rooms: N$500
  - Single rooms: N$650
  - Breakfast included

## Project Goal

Build a lightweight but professional web app that combines:

1. A public guest house website
2. A room availability and booking enquiry system
3. An admin dashboard for managing rooms, clients, bookings, quotes, receipts, and follow-ups

The app must stay simple, practical, and easy to hand over to the guest house owner.

## Product Positioning

Do not build this as only a brochure website.

Build it as:

**A modern accommodation booking platform with a hospitality-focused admin system.**

The app should feel like a smaller, simpler version of Airbnb/Breather-style accommodation browsing, combined with the admin practicality of the Desert Tech dashboard.

## Core User Types

### Public Visitor / Customer

Can:

- View rooms
- View prices
- Check availability
- Send booking request
- Call directly
- Open WhatsApp with a prefilled booking message
- View guest house services and location

### Owner

Can:

- Manage everything
- View financial records
- View revenue summaries
- Manage users
- Manage settings
- View activity logs
- Generate and manage quotes, receipts, and invoices

### Admin

Can:

- Manage rooms
- Manage bookings
- Manage customers
- Generate quotes and receipts
- Follow up customers
- Send reminders
- Manage booking status

### Staff

Can:

- View bookings
- Update check-in/check-out status
- Add notes
- View guest details needed for operations
- Cannot view owner financial summaries unless owner allows it

## Core Features

- Public homepage
- Rooms listing
- Room details page
- Availability checker
- Booking request form
- WhatsApp and call CTAs
- Admin dashboard
- Room CRUD
- Room image uploads
- Room pricing
- Booking management
- Customer/client records
- Quote generation
- Receipt/invoice generation
- Payment tracking
- Booking reminders
- Follow-ups
- Role-based access
- Owner financial reports

## Optional Future Features

- Online payments
- Booking.com/Airbnb sync
- Customer accounts
- Advanced reports
- Housekeeping module
- Multi-branch support
- SMS reminders
- Loyalty or discount system
- Conference facility calendar
- Seasonal pricing automation

## Risks

- Double bookings if availability logic is weak
- Incorrect invoice calculations if nights are not calculated properly
- Poor admin permissions exposing financial records to staff
- Overcomplicated app that becomes difficult for the owner to use
- AI-generated UI becoming generic, oversized, or inconsistent
- Hardcoded room/pricing content instead of dashboard-managed content

## Assumptions

- The first version does not require online payments
- Most bookings may still be confirmed manually by phone or WhatsApp
- The owner wants a simple dashboard similar to Desert Tech
- Images will be uploaded by the owner/admin
- The app should be affordable to host and maintain
- The guest house has a small to medium booking volume

## Clarification Questions Before Final Build

The coder should confirm:

1. Are the advertised prices still correct?
2. Is N$500 for double room and N$650 for single room final, or should the owner update from dashboard?
3. How many rooms exist?
4. Are double rooms and single rooms room types or individual rooms?
5. Is breakfast always included?
6. Are conference facilities booked per hour, per day, or by quote only?
7. Should customers pay deposit?
8. Should receipts be issued only after payment?
9. Should quotes expire after a set number of days?
10. Should owner/admin receive email, WhatsApp, or dashboard notifications for new bookings?
