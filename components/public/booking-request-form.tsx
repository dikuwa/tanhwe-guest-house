"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

type Props = {
  roomId: string;
  roomName: string;
  pricePerNight: number;
  maxGuests: number;
  availableUnits: number;
  currency: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
};

export function BookingRequestForm(props: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [checkIn, setCheckIn] = useState(props.initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(props.initialCheckOut ?? "");
  const [roomsCount, setRoomsCount] = useState("1");
  const [guestsCount, setGuestsCount] = useState(props.initialGuests ?? "1");
  const [preferredContact, setPreferredContact] = useState("whatsapp");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ bookingNumber: string; message: string } | null>(null);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(
      0,
      Math.round(
        (new Date(`${checkOut}T00:00:00Z`).getTime() - new Date(`${checkIn}T00:00:00Z`).getTime()) /
          86_400_000
      )
    );
  }, [checkIn, checkOut]);
  const total = nights * Number(roomsCount || 0) * props.pricePerNight;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          roomId: props.roomId,
          checkIn,
          checkOut,
          roomsCount,
          guestsCount,
          preferredContact,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send booking request");
      setSuccess(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to send booking request"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className="rounded-xl bg-[color-mix(in_oklch,var(--primary)_12%,var(--background))] p-6"
        role="status"
      >
        <CheckCircle2 className="size-8 text-primary" />
        <h3 className="mt-4 font-playfair text-2xl font-bold">Request received</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{success.message}</p>
        <p className="mt-4 text-sm font-semibold">Reference: {success.bookingNumber}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">From</p>
        <div className="flex items-baseline justify-between gap-4">
          <p>
            <span className="text-2xl font-bold">
              {props.currency}
              {props.pricePerNight}
            </span>{" "}
            <span className="text-sm text-muted-foreground">per night</span>
          </p>
          {nights > 0 && (
            <p className="text-right text-sm">
              <span className="font-bold">
                {props.currency}
                {total}
              </span>
              <br />
              <span className="text-muted-foreground">
                {nights} night{nights === 1 ? "" : "s"}
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="booking-check-in">Check-in</Label>
          <Input
            id="booking-check-in"
            type="date"
            min={today}
            required
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="booking-check-out">Check-out</Label>
          <Input
            id="booking-check-out"
            type="date"
            min={checkIn || today}
            required
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rooms-count">Rooms</Label>
          <Input
            id="rooms-count"
            type="number"
            min="1"
            max={props.availableUnits}
            required
            value={roomsCount}
            onChange={(event) => setRoomsCount(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guests-count">Guests</Label>
          <Input
            id="guests-count"
            type="number"
            min="1"
            max={Math.max(props.maxGuests, props.maxGuests * Number(roomsCount))}
            required
            value={guestsCount}
            onChange={(event) => setGuestsCount(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="+264…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" type="tel" required placeholder="+264…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" name="email" type="email" autoComplete="email" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="preferred-contact">Preferred contact</Label>
        <Select
          value={preferredContact}
          onValueChange={(value) => value && setPreferredContact(value)}
        >
          <SelectTrigger id="preferred-contact" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="phone">Phone call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Special requests (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Arrival time, accessibility needs, or anything else we should know"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={submitting || nights < 1}>
        {submitting ? <Loader2 className="animate-spin" /> : <MessageCircle />} Send booking request
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        No payment is taken now. We will contact you to confirm the booking.
      </p>
    </form>
  );
}
