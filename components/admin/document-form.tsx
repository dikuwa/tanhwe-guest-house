"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
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
import { FormRow } from "@/components/forms/form-row";

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
    toast.success(`${data.type} created`, {
      action: { label: "View document", onClick: () => router.push(`/admin/documents/${data.id}`) },
    });
    router.push(`/admin/documents/${data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border bg-card p-5 shadow-xs"
    >
      <FormRow>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="document-booking">Booking</Label>
          <Select value={bookingId} onValueChange={(v) => v && setBookingId(v)}>
            <SelectTrigger id="document-booking" className="h-11 w-full">
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
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="document-type">Document type</Label>
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger id="document-type" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="receipt">Receipt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="expiresAt">
            Valid until <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Popover>
            <PopoverTrigger
              id="expiresAt"
              className={cn(
                "flex h-11 w-full items-center rounded-lg border border-input bg-transparent px-3 text-sm transition-colors",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                expiresAt ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {expiresAt ? format(expiresAt, "d MMM yyyy") : "Pick a date"}
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
      </FormRow>
      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
