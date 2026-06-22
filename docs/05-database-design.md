# File: 05-database-design.md

# Tanhwe Guest House — Database Design

## Core Tables

- users
- roles
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
- activity_logs
- settings

## Entity Relationship Summary

A customer can have many bookings.

A booking can include one or more rooms.

A room can have many images and amenities.

A booking can have many payments.

A booking can generate many documents.

A booking can have many follow-ups.

## Booking Calculation

Total nights:

`checkout_date - checkin_date`

Total:

`price_per_night × number_of_rooms × number_of_nights`

Then apply:

- extras
- discounts
- deposits
- payments
- balance due

## Availability Rule

A room type is available when:

`available_units - already_booked_units_for_overlapping_dates > 0`

Also check:

- room status
- blocked dates
- maintenance dates

## Important Constraints

- Checkout date must be after check-in date
- Number of nights must be at least 1
- Number of rooms must be at least 1
- Confirmed bookings cannot exceed available room units
- Receipt number must be unique
- Quote number must be unique
