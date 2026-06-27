"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BedDouble,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Minus,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { PublicRoom } from "@/lib/public-data";

type Props = {
  roomId: string;
  roomTypeId: string | null;
  roomName: string;
  pricePerNight: number;
  maxGuests: number;
  availableUnits: number;
  currency: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
  showPayment?: boolean;
  availableRooms?: PublicRoom[];
};

type BookingLine = {
  id: string;
  roomId: string;
  roomTypeId: string;
  roomName: string;
  pricePerNight: number;
  maxGuests: number;
  availableUnits: number;
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
  line?: string;
};

type Step = "rooms" | "details" | "review";

function validatePhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (!value.startsWith("+")) return "Please include your country code (e.g. +264...)";
  if (digits.length < 7 || digits.length > 15) return "Please enter a valid phone number";
  return undefined;
}

function validateEmail(value: string): string | undefined {
  if (!value) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
  return undefined;
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  return Math.max(
    0,
    Math.round(
      (new Date(`${checkOut}T00:00:00Z`).getTime() -
        new Date(`${checkIn}T00:00:00Z`).getTime()) /
        86_400_000
    )
  );
}

function formatDate(value: string) {
  if (!value) return "Select date";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-NA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function lineKey(roomTypeId: string, checkIn: string, checkOut: string) {
  return `${roomTypeId}:${checkIn}:${checkOut}`;
}

export function BookingRequestForm(props: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const firstRoomTypeId = props.roomTypeId ?? props.roomId;
  const roomOptions = useMemo(() => {
    const byType = new Map<string, PublicRoom>();
    for (const room of props.availableRooms ?? []) {
      const key = room.roomTypeId ?? room.id;
      if (!byType.has(key)) byType.set(key, room);
    }
    byType.set(firstRoomTypeId, {
      id: props.roomId,
      roomTypeId: props.roomTypeId,
      name: props.roomName,
      slug: "",
      type: "",
      description: null,
      pricePerNight: props.pricePerNight,
      availableUnits: props.availableUnits,
      maxGuests: props.maxGuests,
      breakfastIncluded: false,
      featured: false,
      imageUrl: null,
      images: [],
      amenities: [],
      bedConfiguration: null,
    });
    return Array.from(byType.values());
  }, [firstRoomTypeId, props]);

  const [mainCheckIn, setMainCheckIn] = useState(props.initialCheckIn ?? "");
  const [mainCheckOut, setMainCheckOut] = useState(props.initialCheckOut ?? "");
  const [draftRoomTypeId, setDraftRoomTypeId] = useState(firstRoomTypeId);
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [draftGuests, setDraftGuests] = useState(Number(props.initialGuests ?? "1"));
  const [draftSameDates, setDraftSameDates] = useState(true);
  const [draftCheckIn, setDraftCheckIn] = useState("");
  const [draftCheckOut, setDraftCheckOut] = useState("");
  const [lines, setLines] = useState<BookingLine[]>([]);
  const [step, setStep] = useState<Step>("rooms");
  const [preferredContact, setPreferredContact] = useState("whatsapp");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [success, setSuccess] = useState<{
    bookingNumber: string;
    message: string;
    fullName?: string;
    totalRooms?: number;
    roomTypes?: string[];
    total?: number;
  } | null>(null);

  const selectedRoom = roomOptions.find((room) => (room.roomTypeId ?? room.id) === draftRoomTypeId) ?? roomOptions[0];
  const draftLineCheckIn = draftSameDates ? mainCheckIn : draftCheckIn;
  const draftLineCheckOut = draftSameDates ? mainCheckOut : draftCheckOut;
  const draftNights = nightsBetween(draftLineCheckIn, draftLineCheckOut);
  const totalRooms = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalGuests = lines.reduce((sum, line) => sum + line.guestsCount, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.pricePerNight * line.quantity * nightsBetween(line.checkIn, line.checkOut),
    0
  );

  function updateMainDates(nextCheckIn: string, nextCheckOut: string) {
    setMainCheckIn(nextCheckIn);
    setMainCheckOut(nextCheckOut);
    setLines((current) =>
      current.map((line) =>
        line.sameDates ? { ...line, checkIn: nextCheckIn, checkOut: nextCheckOut } : line
      )
    );
  }

  function changeMainCheckIn(value: string) {
    updateMainDates(value, mainCheckOut && value >= mainCheckOut ? "" : mainCheckOut);
  }

  function changeMainCheckOut(value: string) {
    updateMainDates(mainCheckIn, value);
  }

  function setQuantity(next: number) {
    setDraftQuantity(Math.min(Math.max(1, next), selectedRoom?.availableUnits ?? 1));
  }

  function addRoomLine() {
    setFieldErrors({});
    if (!selectedRoom || !draftRoomTypeId) {
      setFieldErrors({ line: "Select a room type" });
      return;
    }
    if (!draftLineCheckIn || !draftLineCheckOut || draftNights < 1) {
      setFieldErrors({ line: "Choose valid stay dates before adding this room." });
      return;
    }
    if (draftQuantity > selectedRoom.availableUnits) {
      setFieldErrors({ line: `${selectedRoom.name} has ${selectedRoom.availableUnits} unit(s) available.` });
      return;
    }
    if (draftGuests > selectedRoom.maxGuests * draftQuantity) {
      setFieldErrors({
        line: `${selectedRoom.name} allows up to ${selectedRoom.maxGuests * draftQuantity} guest(s) for ${draftQuantity} room(s).`,
      });
      return;
    }

    const roomTypeId = selectedRoom.roomTypeId ?? selectedRoom.id;
    const key = lineKey(roomTypeId, draftLineCheckIn, draftLineCheckOut);
    setLines((current) => {
      const existing = current.find((line) => lineKey(line.roomTypeId, line.checkIn, line.checkOut) === key);
      if (!existing) {
        return [
          ...current,
          {
            id: crypto.randomUUID(),
            roomId: selectedRoom.id,
            roomTypeId,
            roomName: selectedRoom.name,
            pricePerNight: selectedRoom.pricePerNight,
            maxGuests: selectedRoom.maxGuests,
            availableUnits: selectedRoom.availableUnits,
            quantity: draftQuantity,
            guestsCount: draftGuests,
            checkIn: draftLineCheckIn,
            checkOut: draftLineCheckOut,
            sameDates: draftSameDates,
          },
        ];
      }
      return current.map((line) => {
        if (line.id !== existing.id) return line;
        const quantity = Math.min(line.availableUnits, line.quantity + draftQuantity);
        return {
          ...line,
          quantity,
          guestsCount: Math.min(line.maxGuests * quantity, line.guestsCount + draftGuests),
        };
      });
    });
    toast.success("Room added to your booking");
    setDraftQuantity(1);
    setDraftGuests(1);
    setDraftSameDates(true);
    setDraftCheckIn("");
    setDraftCheckOut("");
  }

  function removeLine(id: string) {
    setLines((current) => current.filter((line) => line.id !== id));
  }

  function updateLine(id: string, updates: Partial<BookingLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...updates } : line)));
  }

  function validateLines() {
    if (!lines.length) return "Add at least one room before continuing.";
    for (const line of lines) {
      const nights = nightsBetween(line.checkIn, line.checkOut);
      if (nights < 1) return `${line.roomName}: check-out must be after check-in.`;
      if (line.quantity < 1) return `${line.roomName}: choose at least one room.`;
      if (line.quantity > line.availableUnits) return `${line.roomName} has only ${line.availableUnits} unit(s) available.`;
      if (line.guestsCount > line.maxGuests * line.quantity) {
        return `${line.roomName} allows up to ${line.maxGuests * line.quantity} guest(s).`;
      }
    }
    return undefined;
  }

  function validateGuestForm(formData: FormData): boolean {
    const errors: FieldErrors = {};
    const fullName = String(formData.get("fullName") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const whatsapp = String(formData.get("whatsapp") ?? "");
    const email = String(formData.get("email") ?? "");
    const lineError = validateLines();
    if (lineError) errors.line = lineError;
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!phone.trim()) errors.phone = "Phone number is required";
    else errors.phone = validatePhone(phone);
    if (whatsapp.trim()) errors.whatsapp = validatePhone(whatsapp);
    errors.email = validateEmail(email);
    Object.keys(errors).forEach((key) => {
      if (!errors[key as keyof FieldErrors]) delete errors[key as keyof FieldErrors];
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function continueToDetails() {
    const lineError = validateLines();
    if (lineError) {
      setFieldErrors({ line: lineError });
      toast.error("Please check your selected rooms — " + lineError);
      return;
    }
    setStep("details");
    setSummaryOpen(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);

    if (step === "details") {
      if (!validateGuestForm(form)) {
        toast.error("Please correct the highlighted fields");
        return;
      }
      setStep("review");
      return;
    }

    if (step !== "review") return;
    if (!validateGuestForm(form)) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((line) => ({
            roomTypeId: line.roomTypeId,
            roomId: line.roomId,
            quantity: line.quantity,
            guestsCount: line.guestsCount,
            checkIn: line.checkIn,
            checkOut: line.checkOut,
          })),
          fullName: String(form.get("fullName") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          whatsapp: String(form.get("whatsapp") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          notes: String(form.get("notes") ?? "").trim(),
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
      toast.error("Booking submission failed — " + message);
    } finally {
      setSubmitting(false);
    }
  }

  const summary = (
    <BookingSummary
      currency={props.currency}
      lines={lines}
      subtotal={subtotal}
      totalRooms={totalRooms}
      totalGuests={totalGuests}
      onRemove={removeLine}
      onUpdate={updateLine}
      onContinue={continueToDetails}
      showContinue={step === "rooms"}
    />
  );

  if (success) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary-50 p-6" role="status">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-6 text-primary" />
        </div>
        <h3 className="mt-4 font-heading text-xl font-bold">Request received</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{success.message}</p>
        <div className="mt-4 space-y-3 rounded-lg border bg-background px-4 py-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Reference number</p>
            <p className="mt-0.5 font-mono font-semibold tabular-nums">{success.bookingNumber}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Rooms</p>
              <p className="font-semibold">{success.totalRooms ?? totalRooms}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold tabular-nums">
                {props.currency}{(success.total ?? subtotal).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {success.roomTypes?.join(", ") || lines.map((line) => line.roomName).join(", ")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {step === "rooms" && (
          <>
            <DateRangePicker
              checkIn={mainCheckIn}
              checkOut={mainCheckOut}
              onCheckInChange={changeMainCheckIn}
              onCheckOutChange={changeMainCheckOut}
              minDate={today}
              checkInId="booking-main-check-in"
              checkOutId="booking-main-check-out"
            />

            <div className="rounded-xl border bg-background p-4">
              <div className="space-y-1.5">
                <Label htmlFor="room-type" className="flex items-center gap-1.5 text-sm font-medium">
                  <BedDouble className="size-4 text-muted-foreground" aria-hidden="true" />
                  Room type
                </Label>
                <Select
                  value={selectedRoom?.name ?? ""}
                  onValueChange={(value) => {
                    const nextRoom = roomOptions.find((room) => room.name === value);
                    if (!nextRoom) return;
                    setDraftRoomTypeId(nextRoom.roomTypeId ?? nextRoom.id);
                    setDraftQuantity(1);
                    setDraftGuests(Math.min(draftGuests, nextRoom.maxGuests));
                  }}
                >
                  <SelectTrigger id="room-type" className="h-11 w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomOptions.map((room) => (
                      <SelectItem key={room.roomTypeId ?? room.id} value={room.name}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoom && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <span>
                        {props.currency}{selectedRoom.pricePerNight.toLocaleString()} per night · Up to {selectedRoom.maxGuests} guest{selectedRoom.maxGuests === 1 ? "" : "s"}
                      </span>
                      <span className="font-medium text-foreground">
                        {selectedRoom.availableUnits} unit{selectedRoom.availableUnits === 1 ? "" : "s"} available
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-sm font-medium">
                        <BedDouble className="size-4 text-muted-foreground" aria-hidden="true" />
                        Rooms
                      </Label>
                      <div className="flex h-11 items-center rounded-lg border bg-background">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Decrease room quantity"
                          onClick={() => setQuantity(draftQuantity - 1)}
                          disabled={draftQuantity <= 1}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="flex-1 text-center text-sm font-semibold tabular-nums">{draftQuantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Increase room quantity"
                          onClick={() => setQuantity(draftQuantity + 1)}
                          disabled={draftQuantity >= selectedRoom.availableUnits}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="draft-guests" className="flex items-center gap-1.5 text-sm font-medium">
                        <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                        Guests
                      </Label>
                      <Input
                        id="draft-guests"
                        type="number"
                        min="1"
                        max={selectedRoom.maxGuests * draftQuantity}
                        value={draftGuests}
                        onChange={(event) => setDraftGuests(Math.max(1, Number(event.target.value)))}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={draftSameDates}
                      onCheckedChange={(checked) => {
                        setDraftSameDates(Boolean(checked));
                        if (checked) {
                          setDraftCheckIn("");
                          setDraftCheckOut("");
                        }
                      }}
                    />
                    Same dates as main stay
                  </label>

                  {!draftSameDates && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DatePicker
                        value={draftCheckIn}
                        onChange={setDraftCheckIn}
                        minDate={today}
                        id="draft-check-in"
                        label="From"
                        icon={<CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />}
                      />
                      <DatePicker
                        value={draftCheckOut}
                        onChange={setDraftCheckOut}
                        minDate={draftCheckIn || today}
                        id="draft-check-out"
                        label="To"
                        icon={<CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />}
                      />
                    </div>
                  )}

                  {draftNights > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">
                        {draftQuantity} room{draftQuantity === 1 ? "" : "s"} · {draftNights} night{draftNights === 1 ? "" : "s"}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {props.currency}{(selectedRoom.pricePerNight * draftQuantity * draftNights).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {fieldErrors.line && (
                    <p className="flex items-start gap-1.5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      {fieldErrors.line}
                    </p>
                  )}

                  <Button
                    type="button"
                    className="w-full"
                    onClick={addRoomLine}
                    disabled={selectedRoom.availableUnits < 1}
                  >
                    <Plus className="size-4" />
                    {selectedRoom.availableUnits < 1 ? "No units available" : "Add to booking"}
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden lg:block">{summary}</div>
          </>
        )}

        {(step === "details" || step === "review") && (
          <>
            <div className="rounded-xl border bg-background p-4">{summary}</div>
            <GuestFields
              fieldErrors={fieldErrors}
              preferredContact={preferredContact}
              setPreferredContact={setPreferredContact}
              disabled={step === "review"}
            />
            {step === "review" && (
              <div className="rounded-xl border bg-primary-50 p-4">
                <h3 className="font-heading text-lg font-bold">Your booking</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalRooms} room{totalRooms === 1 ? "" : "s"} · {totalGuests} guest{totalGuests === 1 ? "" : "s"} · {props.currency}{subtotal.toLocaleString()}
                </p>
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="grid gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(step === "review" ? "details" : "rooms")}>
                {step === "review" ? <Pencil className="size-4" /> : <BedDouble className="size-4" />}
                {step === "review" ? "Edit guest details" : "Edit rooms"}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
                {step === "review" ? (submitting ? "Sending..." : "Submit request") : "Review booking"}
              </Button>
            </div>
          </>
        )}

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

      {lines.length > 0 && step === "rooms" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-[0_-16px_44px_-36px_rgba(17,24,39,.7)] backdrop-blur lg:hidden">
          <Button type="button" className="w-full justify-between" onClick={() => setSummaryOpen(true)}>
            <span>Your booking · {totalRooms} room{totalRooms === 1 ? "" : "s"}</span>
            <span>{props.currency}{subtotal.toLocaleString()}</span>
          </Button>
        </div>
      )}

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-h-[86vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your booking</DialogTitle>
            <DialogDescription>Review selected rooms before entering guest details.</DialogDescription>
          </DialogHeader>
          {summary}
        </DialogContent>
      </Dialog>
    </>
  );
}

function BookingSummary({
  currency,
  lines,
  subtotal,
  totalRooms,
  totalGuests,
  onRemove,
  onUpdate,
  onContinue,
  showContinue,
}: {
  currency: string;
  lines: BookingLine[];
  subtotal: number;
  totalRooms: number;
  totalGuests: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BookingLine>) => void;
  onContinue: () => void;
  showContinue: boolean;
}) {
  if (!lines.length) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        Add a room to start your booking.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-bold">Your booking · {totalRooms} room{totalRooms === 1 ? "" : "s"}</h3>
        <span className="text-sm font-semibold tabular-nums">{currency}{subtotal.toLocaleString()}</span>
      </div>
      <div className="mt-4 divide-y">
        {lines.map((line) => {
          const nights = nightsBetween(line.checkIn, line.checkOut);
          const lineSubtotal = line.pricePerNight * line.quantity * nights;
          return (
            <div key={line.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{line.roomName}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {line.quantity} room{line.quantity === 1 ? "" : "s"} · {line.guestsCount} guest{line.guestsCount === 1 ? "" : "s"}
                    <br />
                    {formatDate(line.checkIn)} to {formatDate(line.checkOut)}
                    {line.sameDates ? " · Same dates as main stay" : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${line.roomName}`}
                  onClick={() => onRemove(line.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`line-qty-${line.id}`}>Rooms</Label>
                  <Input
                    id={`line-qty-${line.id}`}
                    type="number"
                    min="1"
                    max={line.availableUnits}
                    value={line.quantity}
                    onChange={(event) => {
                      const quantity = Math.min(line.availableUnits, Math.max(1, Number(event.target.value)));
                      onUpdate(line.id, {
                        quantity,
                        guestsCount: Math.min(line.guestsCount, line.maxGuests * quantity),
                      });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`line-guests-${line.id}`}>Guests</Label>
                  <Input
                    id={`line-guests-${line.id}`}
                    type="number"
                    min="1"
                    max={line.maxGuests * line.quantity}
                    value={line.guestsCount}
                    onChange={(event) =>
                      onUpdate(line.id, {
                        guestsCount: Math.min(line.maxGuests * line.quantity, Math.max(1, Number(event.target.value))),
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {currency}{line.pricePerNight.toLocaleString()} × {nights} night{nights === 1 ? "" : "s"}
                </span>
                <span className="font-semibold tabular-nums">{currency}{lineSubtotal.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 border-t pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Total guests</span>
          <span>{totalGuests}</span>
        </div>
        <div className="mt-2 flex justify-between font-semibold">
          <span>Accommodation subtotal</span>
          <span className="tabular-nums">{currency}{subtotal.toLocaleString()}</span>
        </div>
      </div>
      {showContinue && (
        <Button type="button" className="mt-4 w-full" onClick={onContinue}>
          Continue
        </Button>
      )}
    </div>
  );
}

function GuestFields({
  fieldErrors,
  preferredContact,
  setPreferredContact,
  disabled,
}: {
  fieldErrors: FieldErrors;
  preferredContact: string;
  setPreferredContact: (value: string) => void;
  disabled: boolean;
}) {
  const preferredContactLabels: Record<string, string> = {
    whatsapp: "WhatsApp",
    phone: "Phone call",
    email: "Email",
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold">Primary guest</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="fullName" className="flex items-center gap-1.5 text-sm font-medium">
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            Full name
          </Label>
          <Input id="fullName" name="fullName" autoComplete="name" required readOnly={disabled} className={cn(fieldErrors.fullName && "border-destructive")} />
          {fieldErrors.fullName && <InlineError>{fieldErrors.fullName}</InlineError>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium">
            <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
            Phone
          </Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" required readOnly={disabled} placeholder="+264 81 234 5678" className={cn(fieldErrors.phone && "border-destructive")} />
          {fieldErrors.phone && <InlineError>{fieldErrors.phone}</InlineError>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp" className="flex items-center gap-1.5 text-sm font-medium">
            <MessageCircle className="size-4 text-muted-foreground" aria-hidden="true" />
            WhatsApp <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="whatsapp" name="whatsapp" type="tel" readOnly={disabled} placeholder="Same as phone if left empty" className={cn(fieldErrors.whatsapp && "border-destructive")} />
          {fieldErrors.whatsapp && <InlineError>{fieldErrors.whatsapp}</InlineError>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium">
            <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
            Email
          </Label>
          <Input id="email" name="email" type="email" autoComplete="email" readOnly={disabled} placeholder="optional" className={cn(fieldErrors.email && "border-destructive")} />
          {fieldErrors.email && <InlineError>{fieldErrors.email}</InlineError>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferred-contact" className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
            Preferred contact
          </Label>
          <Select
            value={preferredContactLabels[preferredContact] ?? "WhatsApp"}
            onValueChange={(value) => {
              const next = Object.entries(preferredContactLabels).find(([, label]) => label === value)?.[0];
              if (next) setPreferredContact(next);
            }}
            disabled={disabled}
          >
            <SelectTrigger id="preferred-contact" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Phone call">Phone call</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="flex items-center gap-1.5 text-sm font-medium">
          <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
          Special requests
        </Label>
        <Textarea id="notes" name="notes" rows={3} readOnly={disabled} placeholder="Arrival time, accessibility needs, or anything else we should know" />
      </div>
    </fieldset>
  );
}

function InlineError({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="size-3" />
      {children}
    </p>
  );
}
