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
        month_caption: "flex items-center justify-between",
        caption_label: "text-sm font-semibold px-1 text-left",
        nav: "flex items-center gap-0.5",
        button_previous:
          "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        button_next:
          "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        month_grid: "w-full border-collapse",
        weekdays: "",
        weekday: "h-7 w-9 text-xs font-medium text-muted-foreground text-center",
        week: "",
        day: cn(
          "h-9 w-9 p-0 text-sm text-center",
          "focus-within:relative focus-within:z-20"
        ),
        day_button: cn(
          "inline-flex size-9 items-center justify-center rounded-md text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "aria-selected:bg-primary aria-selected:text-primary-foreground",
          "aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground"
        ),
        selected:
          "bg-primary/10 text-foreground font-semibold rounded-md aria-selected:bg-primary aria-selected:text-primary-foreground",
        today: "font-semibold ring-1 ring-primary/30",
        outside: "text-muted-foreground opacity-40",
        disabled: "text-muted-foreground opacity-25",
        hidden: "invisible",
        range_start:
          "rounded-l-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        range_end:
          "rounded-r-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        range_middle:
          "bg-primary/10 text-foreground",
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
