# File: 03-ui-specification.md

# Tanhwe Guest House — UI Specification

## Public Pages

### 1. Homepage

Purpose:

- Introduce Tanhwe Guest House
- Let visitors check availability quickly
- Drive calls and WhatsApp bookings

Sections:

1. Header
2. Hero with booking search
3. Why stay with us
4. Featured rooms
5. Conference facilities
6. Gallery
7. Location/contact
8. Footer

Hero requirements:

- Large real guest house/room image
- Clear headline
- Booking widget:
  - Check-in
  - Check-out
  - Guests
  - Rooms
  - Search availability
- CTAs:
  - Book your stay
  - WhatsApp us
  - Call now

### 2. Rooms Listing Page

Purpose:

- Show all available room types

Components:

- Search/filter bar
- Room cards
- Availability states
- Price per night
- Amenities summary
- Book/view details button

Room card fields:

- Image
- Room name
- Room type
- Price per night
- Max guests
- Breakfast included badge
- Availability badge

### 3. Room Detail Page

Inspired mostly by Breather.

Layout:

- Large gallery at top
- Room title
- Location
- Rating/testimonial optional
- Amenities
- Description
- Rules
- Booking card on right desktop
- Booking card sticky or bottom CTA on mobile

Booking card fields:

- Check-in
- Check-out
- Number of rooms
- Guests
- Price per night
- Number of nights
- Total
- Submit booking request
- WhatsApp booking button

### 4. Booking Request Page / Modal

Fields:

- Full name
- Phone
- WhatsApp number
- Email optional
- Check-in
- Check-out
- Room type
- Number of rooms
- Number of guests
- Special requests
- Preferred contact method

States:

- Loading
- Success
- Validation errors
- Availability conflict
- Server error

### 5. Contact Page

Components:

- Location
- Phone
- WhatsApp
- Email if available
- Map placeholder/embed
- Opening/reception hours if available

## Admin Pages

### 1. Dashboard Overview

Cards:

- Total bookings
- Pending bookings
- Confirmed bookings
- Upcoming check-ins
- Upcoming check-outs
- Revenue summary for owner only
- Occupancy estimate

### 2. Rooms Management

Features:

- Add room
- Edit room
- Delete/deactivate room
- Upload images
- Set price
- Set number of units
- Set amenities
- Set blocked dates
- Set status

### 3. Bookings

Views:

- Table view
- Calendar/list view optional

Fields:

- Booking ID
- Customer
- Room
- Check-in
- Check-out
- Nights
- Total
- Payment status
- Booking status
- Source
- Actions

### 4. Customers

Fields:

- Name
- Phone
- WhatsApp
- Email
- Booking history
- Notes

### 5. Documents

Tabs:

- Quotes
- Receipts
- Invoices

Actions:

- Generate
- Download PDF
- Send by email
- Share by WhatsApp
- Mark paid
- Convert quote to booking/receipt

### 6. Follow-ups

Features:

- Follow-up tasks
- Reminder queue
- Overdue tasks
- Completed tasks

### 7. Users

Roles:

- Owner
- Admin
- Staff

Owner can manage all users.

### 8. Settings

Settings:

- Guest house name
- Contact number
- WhatsApp number
- Location
- Check-in time
- Check-out time
- Breakfast setting
- Currency
- Quote validity
- Receipt numbering prefix
- Email templates
- WhatsApp templates

## Responsive Rules

Mobile:

- Single column
- Sticky booking CTA
- Compact cards
- Simple navigation drawer

Tablet:

- Two-column where possible
- Avoid cut-off menus

Desktop:

- Use max width
- Two-column room detail layout
- Sidebar admin layout
