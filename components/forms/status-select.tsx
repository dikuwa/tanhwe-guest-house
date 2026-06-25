"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "text-amber-600",
  confirmed: "text-blue-600",
  "checked-in": "text-emerald-600",
  "checked-out": "text-neutral-600",
  cancelled: "text-red-600",
  "no-show": "text-red-700",
  unpaid: "text-amber-600",
  "partially-paid": "text-blue-600",
  paid: "text-emerald-600",
  refunded: "text-neutral-500",
  active: "text-emerald-600",
  maintenance: "text-amber-600",
  blocked: "text-red-600",
  completed: "text-emerald-600",
  overdue: "text-red-600",
  draft: "text-neutral-500",
};

type StatusSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Override the color for the current value */
  color?: string;
  id?: string;
};

export function StatusSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select status",
  disabled,
  className,
  color,
  id,
}: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => v && onValueChange(v)} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={cn(
          "w-full",
          value && (color || statusColors[value]),
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className={cn("capitalize", statusColors[opt.value])}>
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Convenience option lists
export const bookingStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked-in", label: "Checked in" },
  { value: "checked-out", label: "Checked out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No show" },
];

export const paymentStatusOptions = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partially-paid", label: "Partially paid" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

export const roomStatusOptions = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "blocked", label: "Blocked" },
];

export const followUpStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
];
