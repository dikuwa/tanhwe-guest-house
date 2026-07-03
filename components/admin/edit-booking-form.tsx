"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
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
import { FieldError } from "@/components/forms/field-error";
import { cn } from "@/lib/utils";
import { dateToDateOnly, nightsBetweenDateOnly } from "@/lib/date-only";

type RoomTypeOption = {
  id: string;
  name: string;
  pricePerNight: number;
  maxGuests: number;
  status: string;
};

type BookingRoom = {
  id: string;
  roomTypeId: string | null;
  roomNameSnapshot: string;
  pricePerNight: number;
  roomsCount: number;
  nights: number;
  subtotal: number;
  checkIn: Date | null;
  checkOut: Date | null;
  guestsCount: number | null;
};

type BookingData = {
  id: string;
  bookingNumber: string;
  customerId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestsCount: number;
  subtotal: number;
  extrasTotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes: string | null;
  customer: { id: string; fullName: string; phone: string; whatsapp: string; email: string | null };
  rooms: BookingRoom[];
};

type EditRoomLine = {
  id: string;
  roomTypeId: string;
  quantity: number;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  sameDates: boolean;
  pricePerNight: number;
};

function createLine(): EditRoomLine {
  return {
    id: crypto.randomUUID(),
    roomTypeId: "",
    quantity: 1,
    guestsCount: 1,
    checkIn: "",
    checkOut: "",
    sameDates: true,
    pricePerNight: 0,
  };
}

function parseDateOnly(s: string | Date | null | undefined): string {
  if (!s) return "";
  if (typeof s === "string") return s;
  return dateToDateOnly(s);
}

export function EditBookingForm({
  booking,
  roomTypes,
}: {
  booking: BookingData;
  roomTypes: RoomTypeOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [checkIn, setCheckIn] = useState(parseDateOnly(booking.checkIn));
  const [checkOut, setCheckOut] = useState(parseDateOnly(booking.checkOut));
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<{ id: string; fullName: string; phone: string; whatsapp: string; email: string | null }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; fullName: string; phone: string; whatsapp: string; email: string | null }>({
    id: booking.customerId,
    fullName: booking.customer.fullName,
    phone: booking.customer.phone,
    whatsapp: booking.customer.whatsapp,
    email: booking.customer.email,
  });
  const [searching, setSearching] = useState(false);
  const [extras, setExtras] = useState(booking.extrasTotal);
  const [discount, setDiscount] = useState(booking.discount);
  const [notes, setNotes] = useState(booking.notes ?? "");

  const [lines, setLines] = useState<EditRoomLine[]>(() =>
    booking.rooms.length > 0
      ? booking.rooms.map((room) => ({
          id: room.id,
          roomTypeId: room.roomTypeId ?? "",
          quantity: room.roomsCount,
          guestsCount: room.guestsCount ?? 1,
          checkIn: room.checkIn ? parseDateOnly(room.checkIn) : "",
          checkOut: room.checkOut ? parseDateOnly(room.checkOut) : "",
          sameDates:
            !room.checkIn ||
            (parseDateOnly(room.checkIn) === parseDateOnly(booking.checkIn) &&
              parseDateOnly(room.checkOut) === parseDateOnly(booking.checkOut)),
          pricePerNight: room.pricePerNight,
        }))
      : [createLine()]
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const activeRoomTypes = roomTypes.filter((rt) => rt.status === "active");

  useEffect(() => {
    if (customerSearch.length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerResults(data);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  function updateLine(id: string, updates: Partial<EditRoomLine>) {
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

  const total = lines.reduce((sum, line) => {
    const rt = roomTypes.find((r) => r.id === line.roomTypeId);
    const ci = line.sameDates ? checkIn : line.checkIn;
    const co = line.sameDates ? checkOut : line.checkOut;
    const n = nightsBetweenDateOnly(ci, co);
    const rate = line.pricePerNight > 0 ? line.pricePerNight : (rt?.pricePerNight ?? 0);
    return sum + rate * line.quantity * n;
  }, 0);
  const grandTotal = Math.max(0, total + extras - discount);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!checkIn || !checkOut) errors.dates = "Select main stay dates";
    if (checkIn && checkOut && checkIn >= checkOut) errors.dates = "Check-out must be after check-in";

    for (const line of lines) {
      if (!line.roomTypeId) {
        errors[`line-${line.id}`] = "Select a room type";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    const body = {
      customerId: selectedCustomer.id,
      fullName: selectedCustomer.fullName,
      phone: selectedCustomer.phone,
      whatsapp: selectedCustomer.whatsapp || undefined,
      email: selectedCustomer.email || undefined,
      notes: notes || undefined,
      extras,
      discount,
      lines: lines.map((line) => {
        const ci = line.sameDates ? checkIn : line.checkIn;
        const co = line.sameDates ? checkOut : line.checkOut;
        const rt = roomTypes.find((r) => r.id === line.roomTypeId);
        const rate = line.pricePerNight > 0 ? line.pricePerNight : (rt?.pricePerNight ?? 0);
        return {
          id: line.id,
          roomTypeId: line.roomTypeId,
          quantity: line.quantity,
          guestsCount: line.guestsCount,
          checkIn: ci,
          checkOut: co,
          pricePerNight: rate,
        };
      }),
    };
    const response = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(data.error ?? "Could not update booking");
    toast.success("Booking updated");
    router.push(`/admin/bookings/${booking.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6"
      noValidate
    >
      {/* ── Customer selection ── */}
      <div className="mb-6 border-b border-neutral-100 pb-6">
        <p className="mb-3 text-sm font-medium text-neutral-800">Guest</p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="customer-search">Search existing guest</Label>
            <Input
              id="customer-search"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                if (e.target.value.length < 2) setCustomerResults([]);
              }}
              placeholder="Type name or phone..."
              className="mt-1 h-11"
            />
            {searching && <p className="mt-1 text-xs text-muted-foreground">Searching...</p>}
            {customerResults.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border bg-white shadow-xs">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50",
                      c.id === selectedCustomer.id && "bg-primary/5 font-medium"
                    )}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerSearch(c.fullName);
                      setCustomerResults([]);
                    }}
                  >
                    <span>{c.fullName}</span>
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCustomer && (
            <div className="rounded-lg border bg-neutral-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800">{selectedCustomer.fullName}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                  {selectedCustomer.email && (
                    <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stay dates ── */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-neutral-800">Main stay dates</p>
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          checkInId="edit-check-in"
          checkOutId="edit-check-out"
        />
        {fieldErrors.dates && <FieldError>{fieldErrors.dates}</FieldError>}
      </div>

      {/* ── Room lines ── */}
      <div className="mb-6 space-y-4">
        <p className="text-sm font-medium text-neutral-800">Room lines</p>
        {lines.map((line, index) => {
          const rt = roomTypes.find((r) => r.id === line.roomTypeId);
          const lineCheckIn = line.sameDates ? checkIn : line.checkIn;
          const lineCheckOut = line.sameDates ? checkOut : line.checkOut;
          const nights = nightsBetweenDateOnly(lineCheckIn, lineCheckOut);
          const rate = line.pricePerNight > 0 ? line.pricePerNight : (rt?.pricePerNight ?? 0);
          const lineSubtotal = rt && nights > 0 ? rate * line.quantity * nights : 0;
          const lineErr = fieldErrors[`line-${line.id}`];

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
                    onValueChange={(v) => {
                      if (!v) return;
                      const rt = roomTypes.find((r) => r.id === v);
                      updateLine(line.id, {
                        roomTypeId: v,
                        pricePerNight: rt?.pricePerNight ?? 0,
                      });
                    }}
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

              {/* Per-line date pickers */}
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

              {/* Line rate override */}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`rate-${line.id}`}>
                    Rate per night{" "}
                    <span className="text-muted-foreground font-normal">(auto from room type)</span>
                  </Label>
                  <Input
                    id={`rate-${line.id}`}
                    type="number"
                    min="0"
                    value={line.pricePerNight}
                    onChange={(e) => updateLine(line.id, { pricePerNight: Math.max(0, Number(e.target.value)) })}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Line subtotal preview */}
              {rt && nights > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  <span>
                    {rt.name} &times; {line.quantity} room{line.quantity > 1 ? "s" : ""} &times; {nights} night{nights > 1 ? "s" : ""} @ N${rate}/night
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

      {/* ── Extras & Discount ── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="extras">Extras (N$)</Label>
          <Input
            id="extras"
            type="number"
            min="0"
            value={extras}
            onChange={(e) => setExtras(Math.max(0, Number(e.target.value)))}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount">Discount (N$)</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
            className="h-11"
          />
        </div>
      </div>

      {/* ── Total preview ── */}
      <div className="mb-6 space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Room subtotal</span>
          <span className="tabular-nums text-neutral-800">N${total.toLocaleString()}</span>
        </div>
        {extras > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Extras</span>
            <span className="tabular-nums text-neutral-800">+ N${extras.toLocaleString()}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Discount</span>
            <span className="tabular-nums text-neutral-800">- N${discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-2 font-bold text-neutral-900">
          <span>Grand total</span>
          <span className="tabular-nums">N${grandTotal.toLocaleString()}</span>
        </div>
        {booking.amountPaid > 0 && (
          <>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Already paid</span>
              <span className="tabular-nums">N${booking.amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-secondary">
              <span>Balance due</span>
              <span className="tabular-nums">N${Math.max(0, grandTotal - booking.amountPaid).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Notes ── */}
      <div className="mb-6">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/bookings/${booking.id}`)}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
