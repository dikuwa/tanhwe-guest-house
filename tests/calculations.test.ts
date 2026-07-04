import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBookingTotal,
  calculateBookingTotals,
  calculateNights,
  parseStayDate,
} from "../lib/booking-calculations";
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

test("central booking totals handle multiple lines, extras, discount, tax, and balance", () => {
  assert.deepEqual(
    calculateBookingTotals({
      lines: [
        { pricePerNight: 500, roomsCount: 1, nights: 2 },
        { pricePerNight: 1250, roomsCount: 2, nights: 3 },
      ],
      extras: 250,
      discount: 100,
      tax: 50,
      amountPaid: 1000,
    }),
    {
      roomSubtotal: 8500,
      extrasTotal: 250,
      discount: 100,
      tax: 50,
      subtotal: 8750,
      total: 8700,
      amountPaid: 1000,
      balanceDue: 7700,
    }
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

// ── Folio calculation tests ──

import {
  calculateFolioTotals,
  calculateBookingFinancialSummary,
} from "../lib/folio";

test("folio: empty lines produce zero totals", () => {
  const result = calculateFolioTotals([]);
  assert.equal(result.serviceTotal, 0);
  assert.equal(result.extraTotal, 0);
  assert.equal(result.discountTotal, 0);
  assert.equal(result.folioChargesTotal, 0);
});

test("folio: single service line", () => {
  const result = calculateFolioTotals([
    { kind: "service", qty: 2, unitPrice: 150 },
  ]);
  assert.equal(result.serviceTotal, 300);
  assert.equal(result.extraTotal, 0);
  assert.equal(result.discountTotal, 0);
  assert.equal(result.folioChargesTotal, 300);
});

test("folio: multiple service lines", () => {
  const result = calculateFolioTotals([
    { kind: "service", qty: 1, unitPrice: 200 },
    { kind: "service", qty: 3, unitPrice: 50 },
  ]);
  assert.equal(result.serviceTotal, 350);
  assert.equal(result.folioChargesTotal, 350);
});

test("folio: extra charge (custom kind)", () => {
  const result = calculateFolioTotals([
    { kind: "custom", qty: 1, unitPrice: 500 },
  ]);
  assert.equal(result.serviceTotal, 0);
  assert.equal(result.extraTotal, 500);
  assert.equal(result.folioChargesTotal, 500);
});

test("folio: discount line", () => {
  const result = calculateFolioTotals([
    { kind: "discount", qty: 1, unitPrice: 200 },
  ]);
  assert.equal(result.serviceTotal, 0);
  assert.equal(result.discountTotal, 200);
  assert.equal(result.folioChargesTotal, 0);
});

test("folio: quantity times unit price", () => {
  const result = calculateFolioTotals([
    { kind: "service", qty: 4, unitPrice: 250 },
  ]);
  assert.equal(result.serviceTotal, 1000);
});

test("folio: mixed services and discount", () => {
  const result = calculateFolioTotals([
    { kind: "service", qty: 2, unitPrice: 300 },
    { kind: "custom", qty: 1, unitPrice: 100 },
    { kind: "discount", qty: 1, unitPrice: 150 },
  ]);
  assert.equal(result.serviceTotal, 600);
  assert.equal(result.extraTotal, 100);
  assert.equal(result.discountTotal, 150);
  assert.equal(result.folioChargesTotal, 700);
});

test("folio: handles non-finite values gracefully", () => {
  const result = calculateFolioTotals([
    { kind: "service", qty: Infinity, unitPrice: 100 },
    { kind: "discount", qty: 1, unitPrice: NaN },
  ]);
  assert.equal(result.serviceTotal, 0);
  assert.equal(result.discountTotal, 0);
  assert.equal(result.folioChargesTotal, 0);
});

test("financial summary: uses folio lines when provided", () => {
  const result = calculateBookingFinancialSummary({
    roomSubtotal: 5000,
    folioLines: [
      { kind: "service", qty: 2, unitPrice: 200 },
      { kind: "discount", qty: 1, unitPrice: 100 },
    ],
    legacyExtrasTotal: 999,
    legacyDiscount: 999,
  });
  assert.equal(result.roomSubtotal, 5000);
  assert.equal(result.extrasTotal, 400); // From folio, not legacy
  assert.equal(result.discountTotal, 100); // From folio, not legacy
  assert.equal(result.bookingTotal, 5300);
});

test("financial summary: falls back to legacy when no folio lines", () => {
  const result = calculateBookingFinancialSummary({
    roomSubtotal: 5000,
    folioLines: null,
    legacyExtrasTotal: 300,
    legacyDiscount: 100,
  });
  assert.equal(result.extrasTotal, 300);
  assert.equal(result.discountTotal, 100);
  assert.equal(result.bookingTotal, 5200);
});

test("financial summary: empty folio array means no additional charges", () => {
  const result = calculateBookingFinancialSummary({
    roomSubtotal: 5000,
    folioLines: [],
    legacyExtrasTotal: 300,
    legacyDiscount: 100,
  });
  // Empty array = we intentionally set folio lines = use folio (zero), not legacy
  assert.equal(result.extrasTotal, 0);
  assert.equal(result.discountTotal, 0);
  assert.equal(result.bookingTotal, 5000);
});

test("financial summary: amount paid and balance due", () => {
  const result = calculateBookingFinancialSummary({
    roomSubtotal: 5000,
    folioLines: [{ kind: "service", qty: 1, unitPrice: 500 }],
    amountPaid: 2000,
  });
  assert.equal(result.bookingTotal, 5500);
  assert.equal(result.amountPaid, 2000);
  assert.equal(result.balanceDue, 3500);
});

test("financial summary: full payment results in zero balance", () => {
  const result = calculateBookingFinancialSummary({
    roomSubtotal: 3000,
    amountPaid: 3000,
  });
  assert.equal(result.bookingTotal, 3000);
  assert.equal(result.balanceDue, 0);
});

test("financial summary: never returns NaN or negative", () => {
  const result = calculateBookingFinancialSummary({
    roomSubtotal: NaN,
    folioLines: null,
    legacyExtrasTotal: NaN,
    legacyDiscount: NaN,
    amountPaid: NaN,
  });
  assert.equal(Number.isNaN(result.roomSubtotal), false);
  assert.equal(Number.isNaN(result.extrasTotal), false);
  assert.equal(Number.isNaN(result.discountTotal), false);
  assert.equal(Number.isNaN(result.bookingTotal), false);
  assert.equal(Number.isNaN(result.amountPaid), false);
  assert.equal(Number.isNaN(result.balanceDue), false);
  assert.ok(result.roomSubtotal >= 0);
  assert.ok(result.extrasTotal >= 0);
  assert.ok(result.discountTotal >= 0);
  assert.ok(result.bookingTotal >= 0);
  assert.ok(result.amountPaid >= 0);
  assert.ok(result.balanceDue >= 0);
});

test("financial summary: correct room-only booking", () => {
  const result = calculateBookingFinancialSummary({
    roomSubtotal: 8500,
  });
  assert.equal(result.roomSubtotal, 8500);
  assert.equal(result.extrasTotal, 0);
  assert.equal(result.discountTotal, 0);
  assert.equal(result.folioChargesTotal, 0);
  assert.equal(result.bookingTotal, 8500);
  assert.equal(result.amountPaid, 0);
  assert.equal(result.balanceDue, 8500);
});

test("financial summary: multiple service lines with discount", () => {
  const result = calculateBookingFinancialSummary({
    roomSubtotal: 6000,
    folioLines: [
      { kind: "service", qty: 3, unitPrice: 100 },
      { kind: "custom", qty: 1, unitPrice: 250 },
      { kind: "discount", qty: 2, unitPrice: 75 },
    ],
  });
  assert.equal(result.extrasTotal, 550); // 300 + 250
  assert.equal(result.discountTotal, 150); // 2 * 75
  assert.equal(result.bookingTotal, 6400); // 6000 + 550 - 150
});

test("financial summary: deposit and partial payment", () => {
  const result1 = calculateBookingFinancialSummary({
    roomSubtotal: 5000,
    folioLines: [{ kind: "service", qty: 1, unitPrice: 1000 }],
    amountPaid: 2000,
  });
  assert.equal(result1.bookingTotal, 6000);
  assert.equal(result1.amountPaid, 2000);
  assert.equal(result1.balanceDue, 4000);

  const result2 = calculateBookingFinancialSummary({
    roomSubtotal: 5000,
    folioLines: [{ kind: "service", qty: 1, unitPrice: 1000 }],
    amountPaid: 2000 + 1500,
  });
  assert.equal(result2.bookingTotal, 6000);
  assert.equal(result2.amountPaid, 3500);
  assert.equal(result2.balanceDue, 2500);

  const result3 = calculateBookingFinancialSummary({
    roomSubtotal: 5000,
    folioLines: [{ kind: "service", qty: 1, unitPrice: 1000 }],
    amountPaid: 6000,
  });
  assert.equal(result3.bookingTotal, 6000);
  assert.equal(result3.balanceDue, 0);
});
