# Documents and payments

Quotes, invoices, and receipts are issued from bookings and receive unique yearly sequences. The JSON snapshot contains customer, stay, room rates/counts/nights, subtotal, extras, discount, total, amount paid, and balance. PDFs are loaded only in the protected download route. Quotes may have validity dates. Receipts are blocked until a payment exists. Payments cannot exceed the outstanding balance and update unpaid, partially-paid, or paid state.
