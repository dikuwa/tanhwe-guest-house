import { dateOnlyToLocalDate } from "./date-only";

export function parseStayDate(value: string): Date {
  const date = dateOnlyToLocalDate(value);
  if (!date) throw new Error("Invalid stay date");
  return date;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

export type BookingLineInput = {
  pricePerNight: number;
  roomsCount: number;
  nights: number;
};

export type BookingTotalsInput = {
  lines: BookingLineInput[];
  extras?: number;
  discount?: number;
  tax?: number;
  amountPaid?: number;
};

export type BookingTotals = {
  roomSubtotal: number;
  extrasTotal: number;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
};

export function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function calculateLineSubtotal(input: BookingLineInput): number {
  return roundMoney(input.pricePerNight * input.roomsCount * input.nights);
}

export function calculateBookingTotals(input: BookingTotalsInput): BookingTotals {
  const roomSubtotal = input.lines.reduce(
    (sum, line) => sum + calculateLineSubtotal(line),
    0
  );
  const extrasTotal = roundMoney(input.extras ?? 0);
  const discount = roundMoney(input.discount ?? 0);
  const tax = roundMoney(input.tax ?? 0);
  const subtotal = roundMoney(roomSubtotal + extrasTotal);
  const total = roundMoney(Math.max(0, subtotal - discount + tax));
  const amountPaid = roundMoney(input.amountPaid ?? 0);
  const balanceDue = roundMoney(Math.max(0, total - amountPaid));
  return { roomSubtotal, extrasTotal, discount, tax, subtotal, total, amountPaid, balanceDue };
}

export function calculateBookingTotal(input: {
  pricePerNight: number;
  roomsCount: number;
  nights: number;
  extras?: number;
  discount?: number;
}) {
  const subtotal = input.pricePerNight * input.roomsCount * input.nights;
  const total = Math.max(0, subtotal + (input.extras ?? 0) - (input.discount ?? 0));
  return { subtotal, total };
}
