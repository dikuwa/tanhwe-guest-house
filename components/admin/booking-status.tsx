"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingStatusOptions } from "@/components/forms/status-select";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "text-amber-600",
  confirmed: "text-blue-600",
  "checked-in": "text-emerald-600",
  "checked-out": "text-neutral-600",
  cancelled: "text-red-600",
  "no-show": "text-red-700",
};

const next: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked-in", "cancelled", "no-show"],
  "checked-in": ["checked-out"],
};

export function BookingStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const options = next[status] ?? [];

  return (
    <Select
      value={status}
      onValueChange={async (value) => {
        if (value === status) return;
        setBusy(true);
        const response = await fetch(`/api/admin/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: value }),
        });
        setBusy(false);
        if (!response.ok) {
          const data = await response.json();
          alert(data.error ?? "Status update failed");
          return;
        }
        router.refresh();
      }}
      disabled={busy || options.length === 0}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-auto min-w-[120px] text-xs font-medium",
          statusColors[status]
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {bookingStatusOptions
          .filter((o) => o.value === status || options.includes(o.value))
          .map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className={cn("capitalize", statusColors[opt.value])}>
                {opt.value === status ? opt.label : `Move to ${opt.label}`}
              </span>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
