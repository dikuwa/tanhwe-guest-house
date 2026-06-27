import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Build a location string from town, region, and country, filtering out empty parts. */
export function buildLocation(town?: string | null, region?: string | null, country?: string | null): string {
  return [town, region, country].filter(Boolean).join(", ");
}
