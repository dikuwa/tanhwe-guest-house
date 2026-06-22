# File: 06-api-specification.md

# API Specification

The coder may implement these as Next.js route handlers or server actions.

## Public APIs

### Check Availability

`POST /api/availability/check`

Request:

```json
{
  "roomId": "room-id",
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-04",
  "roomsCount": 1,
  "guestsCount": 2
}
```

Response:

```json
{
  "available": true,
  "nights": 3,
  "pricePerNight": 650,
  "subtotal": 1950
}
```

### Create Booking Request

`POST /api/bookings/request`

Request:

```json
{
  "customer": {
    "fullName": "Guest Name",
    "phone": "+264...",
    "whatsapp": "+264...",
    "email": "guest@example.com"
  },
  "roomId": "room-id",
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-04",
  "roomsCount": 1,
  "guestsCount": 2,
  "notes": "Special request"
}
```

## Admin APIs

### Rooms

- `GET /api/admin/rooms`
- `POST /api/admin/rooms`
- `PATCH /api/admin/rooms/[id]`
- `DELETE /api/admin/rooms/[id]`

### Bookings

- `GET /api/admin/bookings`
- `POST /api/admin/bookings`
- `PATCH /api/admin/bookings/[id]`

### Customers

- `GET /api/admin/customers`
- `POST /api/admin/customers`
- `PATCH /api/admin/customers/[id]`

### Documents

- `POST /api/admin/documents/quote`
- `POST /api/admin/documents/receipt`
- `GET /api/admin/documents/[id]/download`

### Payments

- `POST /api/admin/payments`
- `PATCH /api/admin/payments/[id]`

## Validation Rules

- checkOut must be after checkIn
- nights must be at least 1
- roomsCount must be at least 1
- phone is required
- room must be active
- booking must not exceed availability
- owner-only endpoints must check role on server
