"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <select
      aria-label="Update booking status"
      value={status}
      disabled={busy || options.length === 0}
      className="h-8 rounded-lg border bg-background px-2 text-xs font-medium"
      onChange={async (event) => {
        const value = event.target.value;
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
    >
      <option value={status}>{status}</option>
      {options.map((value) => (
        <option key={value} value={value}>
          Move to {value}
        </option>
      ))}
    </select>
  );
}
