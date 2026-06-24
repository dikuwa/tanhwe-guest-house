"use client";

import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-3",
        caption: "flex items-center justify-between px-1",
        caption_label: "text-sm font-semibold",
        nav: "flex items-center gap-1",
        nav_button:
          "inline-flex size-7 items-center justify-center rounded-md border border-input bg-transparent text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "w-9 pb-2 text-xs font-medium text-muted-foreground text-center",
        row: "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-sm",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          "inline-flex size-9 items-center justify-center rounded-md text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "aria-selected:bg-primary aria-selected:text-primary-foreground",
          "aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground"
        ),
        day_range_start: "rounded-l-md",
        day_range_end: "rounded-r-md",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "font-semibold",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-30",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left")
            return <ChevronLeft className="size-4" />;
          return <ChevronRight className="size-4" />;
        },
      }}
      {...props}
    />
  );
}
