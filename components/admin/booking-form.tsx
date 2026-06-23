"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker, NightsCounter } from "@/components/ui/date-range-picker";

type Option = {
  id: string;
  name: string;
  pricePerNight: number;
  maxGuests: number;
  availableUnits: number;
};
export function BookingForm({ rooms }: { rooms: Option[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Could not create booking");
    router.push("/admin/bookings");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="roomId">Room</Label>
          <select
            id="roomId"
            name="roomId"
            required
            className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-xs"
          >
            <option value="">Select a room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} &mdash; N${room.pricePerNight}/night ({room.availableUnits} units)
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="status">Initial status</Label>
          <select
            id="status"
            name="status"
            className="mt-2 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-xs"
          >
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInChange={setCheckIn}
            onCheckOutChange={setCheckOut}
            checkInId="admin-check-in"
            checkOutId="admin-check-out"
          />
          <input type="hidden" name="checkIn" value={checkIn} />
          <input type="hidden" name="checkOut" value={checkOut} />
        </div>
        <Field
          label="Rooms required"
          name="roomsCount"
          type="number"
          min="1"
          defaultValue="1"
          required
        />
        <Field label="Guests" name="guestsCount" type="number" min="1" defaultValue="1" required />
        <Field label="Guest name" name="fullName" required />
        <Field label="Phone" name="phone" required />
        <Field label="WhatsApp" name="whatsapp" required />
        <Field label="Email" name="email" type="email" />
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" className="mt-2" />
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button type="submit" size="lg" disabled={saving || rooms.length === 0}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Creating..." : "Create booking"}
        </Button>
      </div>
    </form>
  );
}
function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, ...input } = props;
  return (
    <div>
      <Label htmlFor={String(input.name)}>{label}</Label>
      <Input id={String(input.name)} className="mt-2" {...input} />
    </div>
  );
}
