"use client";

import { CalendarDays } from "lucide-react";
import { Label } from "@/components/ui/label";

type DateRangePickerProps = {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  minDate?: string;
  checkInId?: string;
  checkOutId?: string;
  checkInLabel?: string;
  checkOutLabel?: string;
};

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate,
  checkInId = "date-range-check-in",
  checkOutId = "date-range-check-out",
  checkInLabel = "Check-in",
  checkOutLabel = "Check-out",
}: DateRangePickerProps) {
  const today = minDate ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <CalendarDays className="mr-1 inline size-3 align-middle" />
        Your stay
      </Label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={checkInId} className="text-xs text-neutral-500">
            {checkInLabel}
          </Label>
          <input
            id={checkInId}
            type="date"
            min={today}
            required
            value={checkIn}
            onChange={(e) => {
              onCheckInChange(e.target.value);
              // Auto-set check-out to day after check-in if currently empty or before
              if (checkOut && e.target.value >= checkOut) {
                const nextDay = new Date(e.target.value);
                nextDay.setDate(nextDay.getDate() + 1);
                onCheckOutChange(nextDay.toISOString().slice(0, 10));
              }
            }}
            className="mt-1 block h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-800 shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>
        <div>
          <Label htmlFor={checkOutId} className="text-xs text-neutral-500">
            {checkOutLabel}
          </Label>
          <input
            id={checkOutId}
            type="date"
            min={checkIn || today}
            required
            value={checkOut}
            onChange={(e) => onCheckOutChange(e.target.value)}
            className="mt-1 block h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-800 shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

type NightsCounterProps = {
  checkIn: string;
  checkOut: string;
  currency?: string;
  pricePerNight?: number;
  roomsCount?: number;
};

export function NightsCounter({
  checkIn,
  checkOut,
  currency = "N$",
  pricePerNight,
  roomsCount = 1,
}: NightsCounterProps) {
  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(
      0,
      Math.round(
        (new Date(`${checkOut}T00:00:00Z`).getTime() -
          new Date(`${checkIn}T00:00:00Z`).getTime()) /
          86_400_000
      )
    );
  })();

  if (nights === 0) return null;

  const total = nights * roomsCount * (pricePerNight ?? 0);

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
      <span className="text-neutral-600">
        <strong className="text-neutral-800">{nights}</strong> night
        {nights === 1 ? "" : "s"}
        {roomsCount > 1 && (
          <> &times; <strong className="text-neutral-800">{roomsCount}</strong> room{roomsCount === 1 ? "" : "s"}</>
        )}
      </span>
      {pricePerNight && (
        <span className="font-semibold tabular-nums text-neutral-800">
          {currency}{total.toLocaleString()}
        </span>
      )}
    </div>
  );
}
