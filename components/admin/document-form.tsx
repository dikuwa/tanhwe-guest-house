"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [bookingId, setBookingId] = useState("");
  const [type, setType] = useState("quote");
  const [expiresAt, setExpiresAt] = useState<Date>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      bookingId,
      type,
      expiresAt: expiresAt ? expiresAt.toISOString().slice(0, 10) : "",
    };
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
      <div className="space-y-1.5">
        <Label htmlFor="document-booking">Booking</Label>
        <Select value={bookingId} onValueChange={(v) => v && setBookingId(v)}>
          <SelectTrigger id="document-booking" className="h-9 w-full">
            <SelectValue placeholder="Select booking" />
          </SelectTrigger>
          <SelectContent>
            {bookings.map((booking) => (
              <SelectItem key={booking.id} value={booking.id}>
                {booking.bookingNumber} &middot; {booking.customerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="document-type">Document type</Label>
        <Select value={type} onValueChange={(v) => v && setType(v)}>
          <SelectTrigger id="document-type" className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quote">Quote</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="expiresAt">Valid until</Label>
        <Popover>
          <PopoverTrigger>
            <button
              id="expiresAt"
              type="button"
              className={cn(
                "mt-2 flex h-9 w-full items-center rounded-md border bg-white px-3 text-sm shadow-xs transition-colors",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                expiresAt ? "text-neutral-800" : "text-neutral-400"
              )}
            >
              {expiresAt ? format(expiresAt, "d MMM yyyy") : "Optional"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expiresAt}
              onSelect={setExpiresAt}
              fromDate={new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
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
