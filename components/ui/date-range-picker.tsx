"use client";

import { useState, useCallback } from "react";
import { CalendarCheck, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  addDaysDateOnly,
  dateOnlyToLocalDate,
  localDateToDateOnly,
  nightsBetweenDateOnly,
} from "@/lib/date-only";

type DateRangePickerProps = {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  minDate?: string;
  checkInId?: string;
  checkOutId?: string;
};

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate,
  checkInId = "date-range-check-in",
  checkOutId = "date-range-check-out",
}: DateRangePickerProps) {
  const today = minDate ? dateOnlyToLocalDate(minDate) ?? new Date() : new Date();
  const checkInDate = dateOnlyToLocalDate(checkIn);
  const checkOutDate = dateOnlyToLocalDate(checkOut);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const handleCheckInSelect = useCallback(
    (date: Date | undefined) => {
      const val = localDateToDateOnly(date);
      onCheckInChange(val);
      if (date && checkOutDate && date >= checkOutDate) {
        onCheckOutChange(addDaysDateOnly(val, 1));
      }
    },
    [checkOutDate, onCheckInChange, onCheckOutChange]
  );

  const handleCheckOutSelect = useCallback(
    (date: Date | undefined) => {
      onCheckOutChange(localDateToDateOnly(date));
      setCheckOutOpen(false);
    },
    [onCheckOutChange, setCheckOutOpen]
  );

  const triggerClass = cn(
    "flex h-11 w-full items-center rounded-lg border border-neutral-200 bg-white px-3.5 text-sm shadow-sm transition-colors",
    "hover:border-neutral-300 hover:bg-neutral-50",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label
          htmlFor={checkInId}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          From
        </Label>
        <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
          <PopoverTrigger
            id={checkInId}
            className={cn(
              triggerClass,
              checkIn ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {checkInDate
              ? format(checkInDate, "d MMM yyyy")
              : "Select date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
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
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={checkOutId}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          <CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />
          To
        </Label>
        <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
          <PopoverTrigger
            id={checkOutId}
            className={cn(
              triggerClass,
              checkOut ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {checkOutDate
              ? format(checkOutDate, "d MMM yyyy")
              : "Select date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
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
    return nightsBetweenDateOnly(checkIn, checkOut);
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
