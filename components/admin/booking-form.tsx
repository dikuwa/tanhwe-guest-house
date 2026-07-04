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
import { nightsBetweenDateOnly } from "@/lib/date-only";
import { validatePhoneNumber } from "@/lib/phone";
import { CalendarCheck, CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
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
  pricePerNight: number;
};

type FolioLine = {
  id: string;
  kind: "service" | "custom" | "discount";
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
  sortOrder: number;
};

type FieldErrors = {
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  lineErrors?: Record<string, string>;
};

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
    pricePerNight: 0,
  };
}

export function BookingForm({ roomTypes }: { roomTypes: RoomTypeOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [lines, setLines] = useState<RoomLine[]>([createLine()]);
  const [folioLines, setFolioLines] = useState<FolioLine[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<{ id: string; fullName: string; phone: string; whatsapp: string; email: string | null }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; fullName: string; phone: string; whatsapp: string; email: string | null } | null>(null);
  const [searching, setSearching] = useState(false);
  const [fullName, setFullName] = useState("");

  const derivedFolio = folioLines.length > 0
    ? folioLines.reduce(
        (acc, l) => {
          const lineTotal = Math.max(0, l.qty) * Math.max(0, l.unitPrice);
          if (l.kind === "discount") acc.discount += lineTotal;
          else acc.extras += lineTotal;
          return acc;
        },
        { extras: 0, discount: 0 }
      )
    : { extras: 0, discount: 0 };
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

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
    const phoneErr = validatePhoneNumber(phone);
    if (phoneErr) errors.phone = phoneErr;
    const waErr = whatsapp ? validatePhoneNumber(whatsapp) : undefined;
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
        pricePerNight: line.pricePerNight,
      })),
      customerId: selectedCustomer?.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
      status,
      folioLines: folioLines.length > 0
        ? folioLines.map((l) => ({
            kind: l.kind,
            name: l.name,
            description: l.description,
            qty: l.qty,
            unitPrice: l.unitPrice,
            sortOrder: l.sortOrder,
          }))
        : undefined,
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
    toast.success(`Booking ${data.bookingNumber} created`);
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
          const nights = nightsBetweenDateOnly(lineCheckIn, lineCheckOut);
          const rate = line.pricePerNight > 0 ? line.pricePerNight : (rt?.pricePerNight ?? 0);
          const lineSubtotal = rt && nights > 0 ? rate * line.quantity * nights : 0;
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
                    onValueChange={(v) => {
                      const nextType = roomTypes.find((r) => r.id === v);
                      if (v) {
                        updateLine(line.id, {
                          roomTypeId: v,
                          pricePerNight: nextType?.pricePerNight ?? 0,
                        });
                      }
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
                    onChange={(e) =>
                      updateLine(line.id, {
                        pricePerNight: Math.max(0, Number(e.target.value)),
                      })
                    }
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

      {/* ── Additional items (folio lines) ── */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-800">Additional items</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setFolioLines((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    kind: "service",
                    name: "",
                    description: "",
                    qty: 1,
                    unitPrice: 0,
                    sortOrder: prev.length,
                  },
                ])
              }
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="size-3" />
              Add service, extra or discount
            </button>
          </div>
        </div>

        {folioLines.length > 0 && (
          <div className="space-y-3">
            {folioLines.map((line, idx) => (
              <div
                key={line.id}
                className="rounded-lg border border-neutral-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Line {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFolioLines((prev) =>
                        prev
                          .filter((l) => l.id !== line.id)
                          .map((l, i) => ({ ...l, sortOrder: i }))
                      );
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="size-3" />
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Input
                      value={line.name}
                      onChange={(e) =>
                        setFolioLines((prev) =>
                          prev.map((l) => (l.id === line.id ? { ...l, name: e.target.value } : l))
                        )
                      }
                      placeholder="e.g. Breakfast"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={line.kind}
                      onValueChange={(v) => {
                        setFolioLines((prev) =>
                          prev.map((l) =>
                            l.id === line.id ? { ...l, kind: v as FolioLine["kind"] } : l
                          )
                        );
                      }}
                    >
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="custom">Extra charge</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={line.qty}
                      onChange={(e) =>
                        setFolioLines((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? { ...l, qty: Math.max(1, Number(e.target.value)) }
                              : l
                          )
                        )
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unit price (N$)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={line.unitPrice}
                      onChange={(e) =>
                        setFolioLines((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? { ...l, unitPrice: Math.max(0, Number(e.target.value)) }
                              : l
                          )
                        )
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="invisible">Total</Label>
                    <div className="flex h-11 items-center rounded-lg border border-transparent px-3 text-sm font-semibold tabular-nums">
                      {line.kind === "discount" ? "-" : "+"}N${(line.qty * line.unitPrice).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Total preview ── */}
      {lines.length > 0 && (() => {
        const total = lines.reduce((sum, line) => {
          const rt = roomTypes.find((r) => r.id === line.roomTypeId);
          const ci = line.sameDates ? checkIn : line.checkIn;
          const co = line.sameDates ? checkOut : line.checkOut;
          const n = nightsBetweenDateOnly(ci, co);
          const rate = line.pricePerNight > 0 ? line.pricePerNight : (rt?.pricePerNight ?? 0);
          return sum + (rt ? rate * line.quantity * n : 0);
        }, 0);
        if (total === 0) return null;
        const grandTotal = Math.max(0, total + derivedFolio.extras - derivedFolio.discount);
        return (
          <div className="mb-6 space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Room subtotal</span>
              <span className="tabular-nums text-neutral-800">N${total.toLocaleString()}</span>
            </div>
            {derivedFolio.extras > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Additional charges</span>
                <span className="tabular-nums text-neutral-800">
                  + N${derivedFolio.extras.toLocaleString()}
                </span>
              </div>
            )}
            {derivedFolio.discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Discounts</span>
                <span className="tabular-nums text-neutral-800">
                  - N${derivedFolio.discount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-neutral-200 pt-2 font-bold text-neutral-900">
              <span>Booking total</span>
              <span className="tabular-nums">N${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        );
      })()}

      {/* ── Customer info ── */}
      <div className="mb-6 border-t border-neutral-100 pt-6">
        <p className="mb-3 text-sm font-medium text-neutral-800">Guest information</p>
        <div className="mb-4">
          <Label htmlFor="customer-search">Search existing guest</Label>
          <Input
            id="customer-search"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              if (e.target.value.length < 2) setCustomerResults([]);
              if (selectedCustomer && e.target.value !== selectedCustomer.fullName) {
                setSelectedCustomer(null);
              }
            }}
            placeholder="Type name or phone to search..."
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
                    c.id === selectedCustomer?.id && "bg-primary/5 font-medium"
                  )}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setCustomerSearch(c.fullName);
                    setFullName(c.fullName);
                    setPhone(c.phone);
                    setWhatsapp(c.whatsapp);
                    setEmail(c.email ?? "");
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
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (selectedCustomer && e.target.value !== selectedCustomer.fullName) setSelectedCustomer(null);
              }}
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
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (selectedCustomer && e.target.value !== selectedCustomer.phone) setSelectedCustomer(null);
              }}
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
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                if (selectedCustomer && e.target.value !== selectedCustomer.whatsapp) setSelectedCustomer(null);
              }}
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (selectedCustomer && e.target.value !== (selectedCustomer.email ?? "")) setSelectedCustomer(null);
              }}
              className={cn("mt-2 h-11", fieldErrors.email && "border-destructive")}
            />
            <FieldError>{fieldErrors.email}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" className="mt-2" />
          </div>
        </div>
        {selectedCustomer && (
          <input type="hidden" name="customerId" value={selectedCustomer.id} />
        )}
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
