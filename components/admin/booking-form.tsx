"use client";

import { FieldError } from "@/components/forms/field-error";
import { StatusSelect } from "@/components/forms/status-select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Option = {
  id: string;
  name: string;
  pricePerNight: number;
  maxGuests: number;
  availableUnits: number;
};

type FieldErrors = {
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  checkIn?: string;
  checkOut?: string;
};

function validatePhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (!value.startsWith("+")) return "Include country code (e.g. +264)";
  if (digits.length < 7 || digits.length > 15) return "Invalid phone number";
  return undefined;
}

function validateEmail(value: string): string | undefined {
  if (!value) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
  return undefined;
}

export function BookingForm({ rooms }: { rooms: Option[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validateForm(formData: FormData): boolean {
    const errors: FieldErrors = {};
    const phone = String(formData.get("phone") ?? "");
    const whatsapp = String(formData.get("whatsapp") ?? "");
    const email = String(formData.get("email") ?? "");
    const fullName = String(formData.get("fullName") ?? "");

    if (!fullName.trim()) errors.fullName = "Required";
    if (!checkIn) errors.checkIn = "Select a check-in date";
    if (!checkOut) errors.checkOut = "Select a check-out date";
    if (checkIn && checkOut && checkIn >= checkOut) {
      errors.checkOut = "Check-out must be after check-in";
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) errors.phone = phoneErr;
    const waErr = validatePhone(whatsapp);
    if (waErr) errors.whatsapp = waErr;
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    formData.set("roomId", roomId);
    formData.set("status", status);
    formData.set("checkIn", checkIn);
    formData.set("checkOut", checkOut);
    if (!validateForm(formData)) return;

    setSaving(true);
    const form = Object.fromEntries(formData.entries());
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
    <form
      onSubmit={submit}
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="roomId">Room</Label>
          <Select value={roomId} onValueChange={(v) => v && setRoomId(v)}>
            <SelectTrigger id="roomId" className="h-12 w-full">
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} &mdash; N${room.pricePerNight}/night ({room.availableUnits} units)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Initial status</Label>
          <StatusSelect
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "confirmed", label: "Confirmed" },
              { value: "pending", label: "Pending" },
            ]}
            id="status"
          />
          <input type="hidden" name="status" value={status} />
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
          {(fieldErrors.checkIn || fieldErrors.checkOut) && (
            <FieldError>{fieldErrors.checkIn || fieldErrors.checkOut}</FieldError>
          )}
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
        <div>
          <Label htmlFor="fullName">Guest name</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            className={cn("mt-2 h-12", fieldErrors.fullName && "border-destructive")}
          />
          <FieldError>{fieldErrors.fullName}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            required
            className={cn("mt-2 h-12", fieldErrors.phone && "border-destructive")}
          />
          <FieldError>{fieldErrors.phone}</FieldError>
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            required
            className={cn("mt-2 h-12", fieldErrors.whatsapp && "border-destructive")}
          />
          <FieldError>{fieldErrors.whatsapp}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            className={cn("mt-2 h-12", fieldErrors.email && "border-destructive")}
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" className="mt-2" />
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
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
      <Input id={String(input.name)} className="mt-2 h-12" {...input} />
    </div>
  );
}
