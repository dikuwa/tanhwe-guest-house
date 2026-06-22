# File: 08-testing-plan.md

# Testing Plan

## Functional Tests

### Booking

- Customer can submit booking request
- Check-out cannot be before check-in
- Same-day checkout is rejected unless day-use is enabled
- Room availability is checked correctly
- System prevents overbooking
- Admin can confirm booking
- Admin can cancel booking
- Staff can update check-in/check-out status

### Room Management

- Admin can create room
- Admin can edit room
- Admin can delete/deactivate room
- Images upload correctly
- Room price updates reflect on new bookings
- Old bookings preserve price snapshot

### Documents

- Quote generates correctly
- Receipt generates correctly
- PDF downloads correctly
- Total includes room price, rooms count, and nights
- Balance due displays correctly
- Paid in full does not show incorrect balance due

### Payments

- Payment can be added
- Partial payment updates balance
- Full payment marks paid
- Payment history remains visible

## Security Tests

- Public user cannot access admin routes
- Staff cannot access owner reports
- Admin cannot remove owner unless permitted
- API routes enforce server-side permissions
- Invalid booking payloads are rejected

## Mobile Tests

- Homepage works on mobile
- Booking card works on mobile
- Admin tables are usable on tablet/mobile
- Navigation drawer does not cut off
- WhatsApp/call buttons are accessible

## Accessibility Tests

- Buttons have clear labels
- Inputs have labels
- Contrast is readable
- Keyboard navigation works
- Toast messages are clear

## Edge Cases

- Booking overlaps existing booking
- Booking uses blocked dates
- Room under maintenance
- Customer requests more rooms than available
- Checkout is missing
- Phone number missing
- PDF generation fails
- Email fails to send
- Image upload fails
