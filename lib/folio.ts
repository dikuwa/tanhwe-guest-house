/**
 * Shared helper for booking folio line calculations.
 *
 * Handles:
 *  - Calculating totals from folio lines
 *  - Legacy scalar fallback (extrasTotal, discount)
 *  - Double-counting prevention
 *  - Safe money values (integers only, never NaN/undefined)
 */

export type FolioLineInput = {
  kind: string;
  qty: number;
  unitPrice: number;
};

export type FolioTotals = {
  serviceTotal: number;
  extraTotal: number;
  folioChargesTotal: number;
  discountTotal: number;
};

/** Safe integer clamp – returns 0 for any non-finite value. */
function safeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
}

/**
 * Compute breakdown totals from an array of folio lines.
 *
 * Convention:
 *  - Lines with kind === "discount" contribute to discountTotal only.
 *  - Lines with kind === "service" contribute to serviceTotal.
 *  - Lines with kind === "custom" or "extra" contribute to extraTotal.
 *  - All amounts stored as positive integers (discounts are subtracted later).
 */
export function calculateFolioTotals(lines: FolioLineInput[]): FolioTotals {
  let serviceTotal = 0;
  let extraTotal = 0;
  let discountTotal = 0;

  for (const line of lines) {
    const qty = safeInt(line.qty);
    const unitPrice = safeInt(line.unitPrice);
    const lineTotal = qty * unitPrice;

    switch (line.kind) {
      case "discount":
        discountTotal += lineTotal;
        break;
      case "service":
        serviceTotal += lineTotal;
        break;
      default:
        // "custom", "extra", or any other charge kind
        extraTotal += lineTotal;
        break;
    }
  }

  return {
    serviceTotal,
    extraTotal,
    folioChargesTotal: serviceTotal + extraTotal,
    discountTotal,
  };
}

/**
 * Calculate booking financial summary with legacy fallback.
 *
 * Precedence rule (prevents double-counting):
 *  - If `folioLines` is an array (empty or non-empty), derive extras and discount from folio lines.
 *  - If `folioLines` is null or undefined, fall back to the legacy scalar `extrasTotal` and `discount` values.
 *
 * This prevents double-counting when a booking has both folio lines and legacy scalar values.
 *
 * @returns All monetary values as safe integers (never NaN, never negative).
 */
export function calculateBookingFinancialSummary(params: {
  roomSubtotal: number;
  folioLines?: FolioLineInput[] | null;
  legacyExtrasTotal?: number;
  legacyDiscount?: number;
  amountPaid?: number;
}): {
  roomSubtotal: number;
  extrasTotal: number;
  discountTotal: number;
  folioChargesTotal: number;
  bookingTotal: number;
  amountPaid: number;
  balanceDue: number;
} {
  const roomSubtotal = Math.max(0, safeInt(params.roomSubtotal));
  const amountPaid = Math.max(0, safeInt(params.amountPaid));
  const hasFolio = Array.isArray(params.folioLines);

  let extrasTotal: number;
  let discountTotal: number;

  if (hasFolio) {
    const folio = calculateFolioTotals(params.folioLines!);
    extrasTotal = folio.folioChargesTotal;
    discountTotal = folio.discountTotal;
  } else {
    extrasTotal = Math.max(0, safeInt(params.legacyExtrasTotal));
    discountTotal = Math.max(0, safeInt(params.legacyDiscount));
  }

  const folioChargesTotal = extrasTotal;
  const bookingTotal = Math.max(0, roomSubtotal + extrasTotal - discountTotal);
  const balanceDue = Math.max(0, bookingTotal - amountPaid);

  return {
    roomSubtotal,
    extrasTotal,
    discountTotal,
    folioChargesTotal,
    bookingTotal,
    amountPaid,
    balanceDue,
  };
}
