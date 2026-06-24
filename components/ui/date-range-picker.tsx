"use client";

import { useState, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00Z`);
  return isNaN(d.getTime()) ? undefined : d;
}

function toDateString(date: Date | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

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
  const today = minDate ? new Date(`${minDate}T00:00:00Z`) : new Date();
  const checkInDate = toDate(checkIn);
  const checkOutDate = toDate(checkOut);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const handleCheckInSelect = useCallback(
    (date: Date | undefined) => {
      const val = toDateString(date);
      onCheckInChange(val);
      // Auto-advance check-out if needed
      if (date && checkOutDate && date >= checkOutDate) {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        onCheckOutChange(toDateString(next));
      }
      // Keep popover open for continued interaction
    },
    [checkOutDate, onCheckInChange, onCheckOutChange]
  );

  const handleCheckOutSelect = useCallback(
    (date: Date | undefined) => {
      onCheckOutChange(toDateString(date));
      // Close popover after check-out selection completes the range
      setCheckOutOpen(false);
    },
    [onCheckOutChange, setCheckOutOpen]
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <CalendarDays className="mr-1 inline size-3 align-middle" />
        Your stay
      </Label>
      <div className="grid grid-cols-2 gap-3">
        {/* Check-in */}
        <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
          <PopoverTrigger
            id={checkInId}
            className={cn(
              "mt-1 flex h-12 w-full items-center rounded-md border bg-white px-3 text-sm shadow-xs transition-colors",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
              checkIn ? "text-neutral-800" : "text-neutral-400"
            )}
          >
            {checkInDate
              ? format(checkInDate, "d MMM yyyy")
              : checkInLabel}
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-2" align="start">
            <Calendar
              mode="single"
              selected={checkInDate}
              onSelect={handleCheckInSelect}
              fromDate={today}
              disabled={{ before: today }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Check-out */}
        <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
          <PopoverTrigger
            id={checkOutId}
            className={cn(
              "mt-1 flex h-12 w-full items-center rounded-md border bg-white px-3 text-sm shadow-xs transition-colors",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
              checkOut ? "text-neutral-800" : "text-neutral-400"
            )}
          >
            {checkOutDate
              ? format(checkOutDate, "d MMM yyyy")
              : checkOutLabel}
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-2" align="start">
            <Calendar
              mode="single"
              selected={checkOutDate}
              onSelect={handleCheckOutSelect}
              fromDate={checkInDate || today}
              disabled={{ before: checkInDate || today }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
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
