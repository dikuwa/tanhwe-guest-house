"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { dateOnlyToLocalDate, localDateToDateOnly } from "@/lib/date-only";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  icon?: ReactNode;
};

export function DatePicker({
  value,
  onChange,
  minDate,
  id,
  label,
  placeholder = "Select date",
  icon = <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const today = minDate ? dateOnlyToLocalDate(minDate) ?? new Date() : new Date();
  const selected = dateOnlyToLocalDate(value);

  const triggerClass = cn(
    "flex h-11 w-full items-center rounded-lg border border-neutral-200 bg-white px-3.5 text-sm shadow-sm transition-colors",
    "hover:border-neutral-300 hover:bg-neutral-50",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
  );

  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
          {icon}
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          className={cn(
            triggerClass,
            value ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          {selected ? format(selected, "d MMM yyyy") : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(localDateToDateOnly(date));
              setOpen(false);
            }}
            fromDate={today}
            disabled={{ before: today }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
