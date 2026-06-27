"use client";

import { FieldError } from "@/components/forms/field-error";
import { StatusSelect } from "@/components/forms/status-select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { calculateNights } from "@/lib/booking-calculations";
import { CalendarCheck, CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";

type RoomTypeOption = {
  id: string;
  name: string;
  pricePerNight: number;
  maxGuests: number;
  status: string;
};

type RoomLine = {
  id: string;
  roomTypeId: string;
  quantity: number;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  sameDates: boolean;
};

type FieldErrors = {
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  lineErrors?: Record<string, string>;
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

function createLine(): RoomLine {
  return {
    id: crypto.randomUUID(),
    roomTypeId: "",
    quantity: 1,
    guestsCount: 1,
    checkIn: "",
    checkOut: "",
    sameDates: true,
  };
}

export function BookingForm({ roomTypes }: { roomTypes: RoomTypeOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [lines, setLines] = useState<RoomLine[]>([createLine()]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const activeRoomTypes = roomTypes.filter((rt) => rt.status === "active");

  function updateLine(id: string, updates: Partial<RoomLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }

  function removeLine(id: string) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function addLine() {
    const newLine = createLine();
    newLine.checkIn = checkIn;
    newLine.checkOut = checkOut;
    setLines((prev) => [...prev, newLine]);
  }

  function validateForm(formData: FormData): boolean {
    const errors: FieldErrors = {};
    const phone = String(formData.get("phone") ?? "");
    const whatsapp = String(formData.get("whatsapp") ?? "");
    const email = String(formData.get("email") ?? "");
    const fullName = String(formData.get("fullName") ?? "");

    if (!fullName.trim()) errors.fullName = "Required";
    if (!checkIn || !checkOut) {
      if (!checkIn) errors.fullName = "Select main stay dates";
    }
    if (checkIn && checkOut && checkIn >= checkOut) {
      errors.fullName = "Check-out must be after check-in";
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) errors.phone = phoneErr;
    const waErr = whatsapp ? validatePhone(whatsapp) : undefined;
    if (waErr) errors.whatsapp = waErr;
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    // Validate each line
    const lineErrs: Record<string, string> = {};
    for (const line of lines) {
      if (!line.roomTypeId) {
        lineErrs[line.id] = "Select a room type";
        continue;
      }
      const rt = roomTypes.find((r) => r.id === line.roomTypeId);
      if (!rt || rt.status !== "active") {
        lineErrs[line.id] = "Room type unavailable";
        continue;
      }
      if (line.quantity < 1) {
        lineErrs[line.id] = "At least 1 room required";
        continue;
      }
      if (line.guestsCount < 1) {
        lineErrs[line.id] = "At least 1 guest";
        continue;
      }
      if (line.guestsCount > (rt.maxGuests * line.quantity)) {
        lineErrs[line.id] = `Max ${rt.maxGuests} guest(s) per room`;
        continue;
      }
      const lineCheckIn = line.sameDates ? checkIn : line.checkIn;
      const lineCheckOut = line.sameDates ? checkOut : line.checkOut;
      if (!lineCheckIn || !lineCheckOut) {
        lineErrs[line.id] = "Select dates";
        continue;
      }
      if (lineCheckIn >= lineCheckOut) {
        lineErrs[line.id] = "Check-out must be after check-in";
        continue;
      }
    }

    if (Object.keys(lineErrs).length > 0) errors.lineErrors = lineErrs;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    formData.set("status", status);

    const body = {
      lines: lines.map((line) => ({
        roomTypeId: line.roomTypeId,
        quantity: line.quantity,
        guestsCount: line.guestsCount,
        checkIn: line.sameDates ? checkIn : line.checkIn,
        checkOut: line.sameDates ? checkOut : line.checkOut,
      })),
      fullName: String(formData.get("fullName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
      status,
    };

    // Validate first
    const fd = new FormData();
    fd.set("fullName", body.fullName);
    fd.set("phone", body.phone);
    fd.set("whatsapp", body.whatsapp ?? "");
    fd.set("email", body.email ?? "");
    if (!validateForm(fd)) return;

    setSaving(true);
    const response = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(data.error ?? "Could not create booking");
    toast.success(`Booking ${data.bookingNumber} created`, {
      action: { label: "View booking", onClick: () => router.push(`/admin/bookings/${data.id}`) },
    });
    router.push(`/admin/bookings/${data.id}`);
    router.refresh();
  }

  const isValid = lines.length > 0;

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6"
      noValidate
    >
      {/* ── Stay dates ── */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-neutral-800">Main stay dates</p>
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

      {/* ── Room lines ── */}
      <div className="mb-6 space-y-4">
        <p className="text-sm font-medium text-neutral-800">Room lines</p>
        {lines.map((line, index) => {
          const rt = roomTypes.find((r) => r.id === line.roomTypeId);
          const lineCheckIn = line.sameDates ? checkIn : line.checkIn;
          const lineCheckOut = line.sameDates ? checkOut : line.checkOut;
          const nights = lineCheckIn && lineCheckOut ? calculateNights(new Date(`${lineCheckIn}T00:00:00Z`), new Date(`${lineCheckOut}T00:00:00Z`)) : 0;
          const lineSubtotal = rt && nights > 0 ? rt.pricePerNight * line.quantity * nights : 0;
          const totalNights = checkIn && checkOut ? calculateNights(new Date(`${checkIn}T00:00:00Z`), new Date(`${checkOut}T00:00:00Z`)) : 0;
          const lineErr = fieldErrors.lineErrors?.[line.id];

          return (
            <div
              key={line.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                lineErr ? "border-destructive/40 bg-destructive/[0.02]" : "border-neutral-200"
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Line {index + 1}
                </span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="size-3" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`room-type-${line.id}`}>Room type</Label>
                  <Select
                    value={line.roomTypeId}
                    onValueChange={(v) => v && updateLine(line.id, { roomTypeId: v })}
                  >
                    <SelectTrigger id={`room-type-${line.id}`} className="w-full h-11">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeRoomTypes.map((rt) => (
                        <SelectItem key={rt.id} value={rt.id}>
                          {rt.name} &mdash; N${rt.pricePerNight}/night
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`qty-${line.id}`}>Rooms</Label>
                  <Input
                    id={`qty-${line.id}`}
                    type="number"
                    min="1"
                    max="20"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, { quantity: Math.max(1, Number(e.target.value)) })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`guests-${line.id}`}>Guests</Label>
                  <Input
                    id={`guests-${line.id}`}
                    type="number"
                    min="1"
                    value={line.guestsCount}
                    onChange={(e) => updateLine(line.id, { guestsCount: Math.max(1, Number(e.target.value)) })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="invisible">Same dates</Label>
                  <label className="flex h-11 items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                    <Checkbox
                      checked={line.sameDates}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateLine(line.id, { sameDates: true, checkIn: "", checkOut: "" });
                        } else {
                          updateLine(line.id, { sameDates: false, checkIn: "", checkOut: "" });
                        }
                      }}
                    />
                    Same dates as main stay
                  </label>
                </div>
              </div>

              {/* Per-line date pickers (shown when sameDates is false) */}
              {!line.sameDates && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DatePicker
                    value={line.checkIn}
                    onChange={(val) => updateLine(line.id, { checkIn: val })}
                    minDate={checkIn || undefined}
                    id={`line-ci-${line.id}`}
                    label="From"
                    icon={<CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />}
                  />
                  <DatePicker
                    value={line.checkOut}
                    onChange={(val) => updateLine(line.id, { checkOut: val })}
                    minDate={line.checkIn || checkIn || undefined}
                    id={`line-co-${line.id}`}
                    label="To"
                    icon={<CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />}
                  />
                </div>
              )}

              {/* Line subtotal preview */}
              {rt && nights > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  <span>
                    {rt.name} &times; {line.quantity} room{line.quantity > 1 ? "s" : ""} &times; {nights} night{nights > 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold tabular-nums text-neutral-800">
                    N${lineSubtotal.toLocaleString()}
                  </span>
                </div>
              )}

              {lineErr && <FieldError>{lineErr}</FieldError>}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addLine}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="size-4" />
          Add another room type
        </button>
      </div>

      {/* ── Total preview ── */}
      {lines.length > 0 && (() => {
        const total = lines.reduce((sum, line) => {
          const rt = roomTypes.find((r) => r.id === line.roomTypeId);
          const ci = line.sameDates ? checkIn : line.checkIn;
          const co = line.sameDates ? checkOut : line.checkOut;
          const n = ci && co ? calculateNights(new Date(`${ci}T00:00:00Z`), new Date(`${co}T00:00:00Z`)) : 0;
          return sum + (rt ? rt.pricePerNight * line.quantity * n : 0);
        }, 0);
        if (total === 0) return null;
        return (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
            <span className="text-neutral-600">Estimated total</span>
            <span className="font-bold tabular-nums text-neutral-900">N${total.toLocaleString()}</span>
          </div>
        );
      })()}

      {/* ── Customer info ── */}
      <div className="mb-6 border-t border-neutral-100 pt-6">
        <p className="mb-3 text-sm font-medium text-neutral-800">Guest information</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              required
              className={cn("mt-2 h-11", fieldErrors.fullName && "border-destructive")}
            />
            <FieldError>{fieldErrors.fullName}</FieldError>
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
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              required
              className={cn("mt-2 h-11", fieldErrors.phone && "border-destructive")}
            />
            <FieldError>{fieldErrors.phone}</FieldError>
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp <span className="text-muted-foreground">(optional, defaults to phone)</span></Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              placeholder="Same as phone if left empty"
              className={cn("mt-2 h-11", fieldErrors.whatsapp && "border-destructive")}
            />
            <FieldError>{fieldErrors.whatsapp}</FieldError>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              className={cn("mt-2 h-11", fieldErrors.email && "border-destructive")}
            />
            <FieldError>{fieldErrors.email}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" className="mt-2" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving || !isValid}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Creating..." : "Create booking"}
        </Button>
      </div>
    </form>
  );
}
