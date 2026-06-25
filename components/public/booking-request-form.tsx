"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker, NightsCounter } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";

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
  showPayment?: boolean;
};

type FieldErrors = {
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
};

function validatePhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (!value.startsWith("+")) return "Please include your country code (e.g. +264...)";
  if (digits.length < 7 || digits.length > 15) return "Please enter a valid phone number";
  return undefined;
}

function validateEmail(value: string): string | undefined {
  if (!value) return undefined; // optional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
  return undefined;
}

export function BookingRequestForm(props: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [checkIn, setCheckIn] = useState(props.initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(props.initialCheckOut ?? "");
  const [roomsCount, setRoomsCount] = useState("1");
  const [guestsCount, setGuestsCount] = useState(props.initialGuests ?? "1");
  const [preferredContact, setPreferredContact] = useState("whatsapp");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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

  function validateForm(formData: FormData): boolean {
    const errors: FieldErrors = {};
    const phone = String(formData.get("phone") ?? "");
    const whatsapp = String(formData.get("whatsapp") ?? "");
    const email = String(formData.get("email") ?? "");
    const fullName = String(formData.get("fullName") ?? "");

    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!phone.trim()) errors.phone = "Phone number is required";
    else {
      const phoneErr = validatePhone(phone);
      if (phoneErr) errors.phone = phoneErr;
    }
    if (whatsapp.trim()) {
      const waErr = validatePhone(whatsapp);
      if (waErr) errors.whatsapp = waErr;
    }
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setError("");

    const form = new FormData(event.currentTarget);
    if (!validateForm(form)) {
      toast.error("Please correct the highlighted fields", {
        description: "Some required fields are missing or invalid.",
      });
      return;
    }

    setSubmitting(true);
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
      toast.success("Booking request submitted", {
        description: `Reference: ${data.bookingNumber}. We will get back to you shortly.`,
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to send booking request";
      setError(message);
      toast.error("Booking submission failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary-50 p-6" role="status">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-6 text-primary" />
        </div>
        <h3 className="mt-4 font-heading text-xl font-bold">Request received</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{success.message}</p>
        <div className="mt-4 rounded-lg border bg-background px-4 py-3">
          <p className="text-xs text-muted-foreground">Reference number</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{success.bookingNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <DateRangePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onCheckInChange={setCheckIn}
        onCheckOutChange={setCheckOut}
        minDate={today}
        checkInId="booking-check-in"
        checkOutId="booking-check-out"
      />

      <NightsCounter
        checkIn={checkIn}
        checkOut={checkOut}
        currency={props.currency}
        pricePerNight={props.pricePerNight}
        roomsCount={Number(roomsCount)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
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
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" autoComplete="name" required className={cn(fieldErrors.fullName && "border-destructive")} />
            {fieldErrors.fullName && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3" /> {fieldErrors.fullName}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              placeholder="+264 81 234 5678"
              className={cn(fieldErrors.phone && "border-destructive")}
            />
            {fieldErrors.phone && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3" /> {fieldErrors.phone}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="whatsapp" name="whatsapp" type="tel" placeholder="Same as phone if left empty" className={cn(fieldErrors.whatsapp && "border-destructive")} />
            {fieldErrors.whatsapp && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3" /> {fieldErrors.whatsapp}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="optional" className={cn(fieldErrors.email && "border-destructive")} />
            {fieldErrors.email && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3" /> {fieldErrors.email}
              </p>
            )}
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
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Special requests</Label>
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
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
        {submitting ? "Sending..." : "Send booking request"}
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        No payment is taken now. We&rsquo;ll contact you to confirm the booking.
        {props.showPayment ? (
          <>
            <br />
            Payment options: bank transfer and mobile wallets.
          </>
        ) : null}
      </p>
    </form>
  );
}
