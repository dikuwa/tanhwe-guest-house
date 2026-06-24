import "server-only";

import { getDb } from "./db";
import { settings } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * Format a time value (e.g. "14:00") according to the configured display format.
 * The underlying time is always stored in 24-hour format.
 */
export function formatTime(time: string, format: "12h" | "24h" = "24h"): string {
  if (!time || !time.includes(":")) return time;

  const [hoursStr, minutes] = time.split(":");
  const hours = parseInt(hoursStr, 10);

  if (isNaN(hours)) return time;

  if (format === "12h") {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes} ${period}`;
  }

  // 24-hour format
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

export type TimeFormat = "12h" | "24h";

/**
 * Get the configured time format from site settings.
 * Falls back to "24h" if not configured.
 */
export async function getTimeFormat(): Promise<TimeFormat> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "time_format"));
    if (row?.value === "12h") return "12h";
    return "24h";
  } catch {
    return "24h";
  }
}

/**
 * Format check-in and check-out times using the configured site format.
 */
export async function formatStayTimes(checkIn: string, checkOut: string) {
  const timeFormat = await getTimeFormat();
  return {
    checkInFormatted: formatTime(checkIn, timeFormat),
    checkOutFormatted: formatTime(checkOut, timeFormat),
    timeFormat,
  };
}
