"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

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
      weekStartsOn={1}
      className={cn("p-2.5", className)}
      formatters={{
        formatWeekdayName: (date) => {
          const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
          return days[date.getDay()];
        },
      }}
      classNames={{
        months: "flex flex-col",
        month: "flex flex-col gap-2",
        caption: "flex items-center justify-between",
        caption_label: "text-sm font-semibold px-1 text-left",
        nav: "flex items-center gap-0.5",
        nav_button:
          "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse table-fixed",
        head_row: "",
        head_cell: "h-7 text-xs font-medium text-muted-foreground text-center",
        row: "",
        cell: cn(
          "relative h-8 p-0 text-sm text-center",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-primary/10",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected].day-range-start)]:rounded-l-md"
        ),
        day: cn(
          "inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "aria-selected:bg-primary aria-selected:text-primary-foreground",
          "aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground"
        ),
        day_range_start:
          "day-range-start rounded-l-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_range_end:
          "day-range-end rounded-r-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "font-semibold ring-1 ring-primary/30",
        day_outside: "text-muted-foreground opacity-40",
        day_disabled: "text-muted-foreground opacity-25",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") return <ChevronLeft className="size-4" />;
          return <ChevronRight className="size-4" />;
        },
      }}
      {...props}
    />
  );
}
