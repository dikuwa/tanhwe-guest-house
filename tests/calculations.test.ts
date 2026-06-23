import assert from "node:assert/strict";
import test from "node:test";
import { calculateBookingTotal, calculateNights, parseStayDate } from "../lib/booking-calculations";
import { customerIdentity, normalizeEmail, normalizePhone } from "../lib/customer-matching";

test("stay dates calculate nights in UTC", () => {
  assert.equal(calculateNights(parseStayDate("2026-07-01"), parseStayDate("2026-07-04")), 3);
  assert.equal(calculateNights(parseStayDate("2026-07-01"), parseStayDate("2026-07-01")), 0);
});

test("booking totals include rooms, nights, extras, and discounts", () => {
  assert.deepEqual(
    calculateBookingTotal({
      pricePerNight: 650,
      roomsCount: 2,
      nights: 3,
      extras: 200,
      discount: 100,
    }),
    { subtotal: 3900, total: 4000 }
  );
});

test("booking total never becomes negative", () => {
  assert.equal(
    calculateBookingTotal({ pricePerNight: 500, roomsCount: 1, nights: 1, discount: 900 }).total,
    0
  );
});

test("customer identifiers normalize safely", () => {
  assert.equal(normalizePhone("+264 (81) 380-8097"), "264813808097");
  assert.equal(normalizeEmail(" Guest@Example.COM "), "guest@example.com");
  assert.deepEqual(
    customerIdentity({ phone: "+264 81 1", whatsapp: "00264 81 2", email: "A@B.COM" }),
    { phone: "264811", whatsapp: "264812", email: "a@b.com" }
  );
});
