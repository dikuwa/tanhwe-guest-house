"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BookingOption = {
  id: string;
  bookingNumber: string;
  customerName: string;
  total: number;
  balanceDue: number;
};

export function DocumentForm({ bookings }: { bookings: BookingOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Could not create document");
    router.push(`/admin/documents/${data.id}`);
    router.refresh();
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end"
    >
      <div>
        <Label htmlFor="document-booking">Booking</Label>
        <select
          id="document-booking"
          name="bookingId"
          required
          className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-xs"
        >
          <option value="">Select booking</option>
          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {booking.bookingNumber} &middot; {booking.customerName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="document-type">Document type</Label>
        <select
          id="document-type"
          name="type"
          className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-xs"
        >
          <option value="quote">Quote</option>
          <option value="invoice">Invoice</option>
          <option value="receipt">Receipt</option>
        </select>
      </div>
      <div>
        <Label htmlFor="expiresAt">Valid until</Label>
        <Input id="expiresAt" name="expiresAt" type="date" className="mt-2 h-9" />
      </div>
      <Button type="submit" disabled={saving || !bookings.length}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
        {saving ? "Creating..." : "Create"}
      </Button>
      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 md:col-span-4">
          {error}
        </p>
      )}
    </form>
  );
}
