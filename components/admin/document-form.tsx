"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FormRow } from "@/components/forms/form-row";

type BookingOption = {
  id: string;
  bookingNumber: string;
  customerName: string;
  total: number;
  balanceDue: number;
};

type FolioLine = {
  id: string;
  kind: "service" | "custom" | "discount";
  name: string;
  qty: number;
  unitPrice: number;
};

export function DocumentForm({ bookings }: { bookings: BookingOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [type, setType] = useState("quote");
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [folioLines, setFolioLines] = useState<FolioLine[]>([]);

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

  const selectedBooking = bookings.find((b) => b.id === bookingId);
  const documentTotal = selectedBooking
    ? Math.max(0, selectedBooking.total + derivedFolio.extras - derivedFolio.discount)
    : 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      bookingId,
      type,
      expiresAt: expiresAt ? expiresAt.toISOString().slice(0, 10) : "",
      folioLines:
        folioLines.length > 0
          ? folioLines.map((l) => ({
              kind: l.kind,
              name: l.name,
              qty: l.qty,
              unitPrice: l.unitPrice,
            }))
          : undefined,
    };
    const response = await fetch("/api/admin/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Could not create document");
    toast.success(`${data.type} created`);
    router.push(`/admin/documents/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-5 shadow-xs">
      {/* ── Booking & document type ── */}
      <FormRow>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="document-booking">Booking</Label>
          <Select value={bookingId} onValueChange={(v) => v && setBookingId(v)}>
            <SelectTrigger id="document-booking" className="h-11 w-full">
              <SelectValue placeholder="Select booking" />
            </SelectTrigger>
            <SelectContent>
              {bookings.map((booking) => (
                <SelectItem key={booking.id} value={booking.id}>
                  {booking.bookingNumber} &middot; {booking.customerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="document-type">Document type</Label>
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger id="document-type" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="receipt">Receipt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="expiresAt">
            Valid until <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Popover>
            <PopoverTrigger
              id="expiresAt"
              className={cn(
                "flex h-11 w-full items-center rounded-lg border border-input bg-transparent px-3 text-sm transition-colors",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                expiresAt ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {expiresAt ? format(expiresAt, "d MMM yyyy") : "Pick a date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiresAt}
                onSelect={setExpiresAt}
                fromDate={new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button type="submit" disabled={saving || !bookings.length}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
          {saving ? "Creating..." : "Create"}
        </Button>
      </FormRow>

      {/* ── Additional items (document-specific) ── */}
      {bookingId && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-800">Additional items</p>
            <button
              type="button"
              onClick={() =>
                setFolioLines((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    kind: "service",
                    name: "",
                    qty: 1,
                    unitPrice: 0,
                  },
                ])
              }
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="size-3" />
              Add service, extra or discount
            </button>
          </div>

          {folioLines.length > 0 && (
            <div className="space-y-3 mb-4">
              {folioLines.map((line, idx) => (
                <div key={line.id} className="rounded-lg border border-neutral-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Line {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFolioLines((prev) => prev.filter((l) => l.id !== line.id))
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input
                        value={line.name}
                        onChange={(e) =>
                          setFolioLines((prev) =>
                            prev.map((l) => (l.id === line.id ? { ...l, name: e.target.value } : l))
                          )
                        }
                        placeholder="e.g. Airport transfer"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select
                        value={line.kind}
                        onValueChange={(v) =>
                          setFolioLines((prev) =>
                            prev.map((l) =>
                              l.id === line.id ? { ...l, kind: v as FolioLine["kind"] } : l
                            )
                          )
                        }
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue />
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
                  </div>
                  <div className="mt-2 flex items-center justify-end text-sm tabular-nums font-semibold">
                    {line.kind === "discount" ? "-\u00a0" : "+\u00a0"}N${(line.qty * line.unitPrice).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedBooking && (derivedFolio.extras > 0 || derivedFolio.discount > 0) && (
            <div className="mb-4 space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Booking total</span>
                <span className="tabular-nums text-neutral-800">N${selectedBooking.total.toLocaleString()}</span>
              </div>
              {derivedFolio.extras > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Additional charges</span>
                  <span className="tabular-nums text-neutral-800">+ N${derivedFolio.extras.toLocaleString()}</span>
                </div>
              )}
              {derivedFolio.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Discounts</span>
                  <span className="tabular-nums text-neutral-800">- N${derivedFolio.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-neutral-200 pt-2 font-bold text-neutral-900">
                <span>Document total</span>
                <span className="tabular-nums">N${documentTotal.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </form>
  );
}
