# File: database/schema.md

# Database Schema Draft

## users

- id
- name
- email
- phone
- role
- avatar_url
- status
- created_at
- updated_at

## rooms

- id
- name
- slug
- room_type
- description
- price_per_night
- units_available
- max_guests
- breakfast_included
- status
- featured
- created_at
- updated_at

## room_images

- id
- room_id
- image_url
- alt_text
- sort_order
- created_at

## room_amenities

- id
- room_id
- name
- icon_key
- created_at

## room_blocked_dates

- id
- room_id
- start_date
- end_date
- reason
- created_by
- created_at

## customers

- id
- full_name
- phone
- whatsapp
- email
- address
- id_or_passport
- notes
- created_at
- updated_at

## bookings

- id
- booking_number
- customer_id
- check_in
- check_out
- nights
- guests_count
- status
- payment_status
- source
- subtotal
- discount
- extras_total
- total
- amount_paid
- balance_due
- notes
- created_by
- created_at
- updated_at

## booking_rooms

- id
- booking_id
- room_id
- room_name_snapshot
- price_per_night_snapshot
- rooms_count
- nights
- line_total

## payments

- id
- booking_id
- amount
- method
- reference
- paid_at
- recorded_by
- notes
- created_at

## documents

- id
- booking_id
- customer_id
- type
- document_number
- status
- total
- pdf_url
- expires_at
- created_by
- created_at

## follow_ups

- id
- booking_id
- customer_id
- title
- description
- due_date
- status
- priority
- assigned_to
- completed_at
- created_at

## activity_logs

- id
- user_id
- action
- entity_type
- entity_id
- metadata
- created_at

## settings

- id
- key
- value
- updated_by
- updated_at
