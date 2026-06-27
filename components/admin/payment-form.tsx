"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormRow } from "@/components/forms/form-row";

type BookingOption = {
  id: string;
  bookingNumber: string;
  customerName: string;
  balanceDue: number;
};

export function PaymentForm({ bookings }: { bookings: BookingOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = event.currentTarget;
    const payload = {
      ...Object.fromEntries(new FormData(form)),
      bookingId,
      paymentMethod,
    };
    const response = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    if (response.ok) {
      toast.success("Payment recorded");
      form.reset();
      setBookingId("");
      setPaymentMethod("cash");
      router.refresh();
    } else {
      toast.error(data.error ?? "Could not record payment");
    }
  }

  const activeBookings = bookings.filter((b) => b.balanceDue > 0);

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border bg-card p-5 shadow-xs"
    >
      <FormRow>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="payment-booking">Booking</Label>
          <Select value={bookingId} onValueChange={(v) => v && setBookingId(v)}>
            <SelectTrigger id="payment-booking" className="h-11 w-full">
              <SelectValue placeholder="Select booking" />
            </SelectTrigger>
            <SelectContent>
              {activeBookings.map((booking) => (
                <SelectItem key={booking.id} value={booking.id}>
                  {booking.bookingNumber} &middot; {booking.customerName} &middot; N$ {booking.balanceDue.toFixed(2)} due
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="payment-amount">Amount (N$)</Label>
          <Input id="payment-amount" name="amount" type="number" min="1" step="1" required className="h-11" />
        </div>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="payment-method">Method</Label>
          <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
            <SelectTrigger id="payment-method" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank-transfer">Bank transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <WalletCards className="size-4" />}
          {saving ? "Saving..." : "Record payment"}
        </Button>
      </FormRow>
    </form>
  );
}
