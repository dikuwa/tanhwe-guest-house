"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00Z`);
  return isNaN(d.getTime()) ? undefined : d;
}

export function DateFilter({
  from: initialFrom,
  to: initialTo,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const fromDate = parseDate(initialFrom);
  const toDate = parseDate(initialTo);

  function apply(from?: Date, to?: Date) {
    const params = new URLSearchParams();
    if (from) params.set("from", from.toISOString().slice(0, 10));
    if (to) params.set("to", to.toISOString().slice(0, 10));
    router.push(`/admin/reports?${params.toString()}`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">From</p>
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger>
            <button
              type="button"
              className={cn(
                "flex h-9 w-[150px] items-center rounded-lg border border-neutral-200 bg-white px-3 text-sm shadow-xs transition-colors",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                fromDate ? "text-neutral-800" : "text-neutral-400"
              )}
            >
              <CalendarDays className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
              {fromDate ? format(fromDate, "d MMM yyyy") : "Select start"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) => {
                setFromOpen(false);
                apply(date, toDate && date && date > toDate ? undefined : toDate);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">To</p>
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger>
            <button
              type="button"
              className={cn(
                "flex h-9 w-[150px] items-center rounded-lg border border-neutral-200 bg-white px-3 text-sm shadow-xs transition-colors",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                toDate ? "text-neutral-800" : "text-neutral-400"
              )}
            >
              <CalendarDays className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
              {toDate ? format(toDate, "d MMM yyyy") : "Select end"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(date) => {
                setToOpen(false);
                apply(fromDate, date);
              }}
              fromDate={fromDate}
              disabled={fromDate ? { before: fromDate } : undefined}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button
        type="button"
        size="sm"
        className="h-9"
        onClick={() => {
          // Reset to current month
          const now = new Date();
          const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
          const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
          apply(first, last);
        }}
      >
        This month
      </Button>
    </div>
  );
}
