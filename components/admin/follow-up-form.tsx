"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BellPlus, Loader2 } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PrioritySelect } from "@/components/forms/priority-select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type OptionBase = { id: string; label: string };
type BookingOption = OptionBase & { customerId: string; customerName?: string; checkIn?: Date };

type Options = {
  customerOptions: OptionBase[];
  bookingOptions: BookingOption[];
  staffOptions: OptionBase[];
};

export function FollowUpForm({ options }: { options: Options }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [type, setType] = useState("manual");
  const [priority, setPriority] = useState("normal");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState<Date>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      bookingId,
      customerId,
      title: String((document.getElementById("follow-title") as HTMLInputElement)?.value ?? ""),
      type,
      priority,
      assignedTo,
      dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : "",
    };
    const response = await fetch("/api/admin/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(data.error ?? "Could not create follow-up");
    toast.success("Follow-up created");
    event.currentTarget.reset();
    setBookingId("");
    setCustomerId("");
    setType("manual");
    setPriority("normal");
    setAssignedTo("");
    setDueDate(undefined);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="lg:col-span-2 space-y-1.5">
        <Label htmlFor="follow-booking">Booking</Label>
        <Select
          value={bookingId}
          onValueChange={(v) => {
            if (v === null) return;
            setBookingId(v);
            // Auto-populate customer from selected booking, or clear if no booking
            if (v) {
              const booking = options.bookingOptions.find((b) => b.id === v);
              if (booking?.customerId) setCustomerId(booking.customerId);
            } else {
              setCustomerId("");
            }
          }}
        >
          <SelectTrigger id="follow-booking" className="h-12 w-full">
            <SelectValue placeholder="No booking" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No booking</SelectItem>
            {options.bookingOptions.map((option) => {
              const checkInStr = option.checkIn
                ? option.checkIn.toLocaleDateString("en-NA", { day: "numeric", month: "short", year: "numeric" })
                : "";
              const label = option.customerName
                ? `${option.label} — ${option.customerName} — ${checkInStr}`
                : option.label;
              return (
                <SelectItem key={option.id} value={option.id}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="lg:col-span-2 space-y-1.5">
        <Label htmlFor="follow-customer">Customer</Label>
        <Select value={customerId} onValueChange={(v) => v !== null && setCustomerId(v)}>
          <SelectTrigger id="follow-customer" className="h-12 w-full">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No customer</SelectItem>
            {options.customerOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="follow-title">Task</Label>
        <Input
          id="follow-title"
          name="title"
          required
          className="mt-2 h-12"
          placeholder="e.g. Confirm deposit with guest"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="follow-type">Type</Label>
        <Select value={type} onValueChange={(v) => v !== null && setType(v)}>
          <SelectTrigger id="follow-type" className="h-12 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="arrival">Arrival</SelectItem>
            <SelectItem value="balance">Balance</SelectItem>
            <SelectItem value="quote">Quote</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="follow-due">Due date</Label>
        <Popover>
          <PopoverTrigger>
            <button
              id="follow-due"
              type="button"
              className={cn(
                "mt-2 flex h-12 w-full items-center rounded-md border bg-white px-3 text-sm shadow-xs transition-colors",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                dueDate ? "text-neutral-800" : "text-neutral-400"
              )}
            >
              {dueDate ? format(dueDate, "d MMM yyyy") : "Select date"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              fromDate={new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="follow-priority">Priority</Label>
        <PrioritySelect
          value={priority}
          onValueChange={(v) => v !== null && setPriority(v)}
          id="follow-priority"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="follow-assignee">Assign to</Label>
        <Select value={assignedTo} onValueChange={(v) => v !== null && setAssignedTo(v)}>
          <SelectTrigger id="follow-assignee" className="h-12 w-full">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {options.staffOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <BellPlus className="size-4" />}
          {saving ? "Creating..." : "Create follow-up"}
        </Button>
      </div>
    </form>
  );
}
