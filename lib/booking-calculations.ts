export function parseStayDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
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
