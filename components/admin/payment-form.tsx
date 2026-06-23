"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BookingOption = {
  id: string;
  bookingNumber: string;
  customerName: string;
  balanceDue: number;
};
export function PaymentForm({ bookings }: { bookings: BookingOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    setMessage(response.ok ? "Payment recorded." : (data.error ?? "Could not record payment"));
    if (response.ok) {
      form.reset();
      router.refresh();
    }
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end"
    >
      <div>
        <Label htmlFor="payment-booking">Booking</Label>
        <select
          id="payment-booking"
          name="bookingId"
          required
          className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-xs"
        >
          <option value="">Select booking</option>
          {bookings
            .filter((b) => b.balanceDue > 0)
            .map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.bookingNumber} &middot; {booking.customerName} &middot; N${" "}
                {booking.balanceDue.toFixed(2)} due
              </option>
            ))}
        </select>
      </div>
      <div>
        <Label htmlFor="payment-amount">Amount (N$)</Label>
        <Input
          id="payment-amount"
          name="amount"
          type="number"
          min="1"
          step="1"
          required
          className="mt-2 h-9"
        />
      </div>
      <div>
        <Label htmlFor="payment-method">Method</Label>
        <select
          id="payment-method"
          name="paymentMethod"
          className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-xs"
        >
          <option value="cash">Cash</option>
          <option value="bank-transfer">Bank transfer</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <WalletCards className="size-4" />}
        {saving ? "Saving..." : "Record payment"}
      </Button>
      {message && (
        <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 md:col-span-4">
          {message}
        </p>
      )}
    </form>
  );
}
