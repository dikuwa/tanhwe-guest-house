"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BellPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Options = {
  customerOptions: { id: string; label: string }[];
  bookingOptions: { id: string; label: string; customerId: string }[];
  staffOptions: { id: string; label: string }[];
};
export function FollowUpForm({ options }: { options: Options }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const response = await fetch("/api/admin/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Could not create follow-up");
    form.reset();
    router.refresh();
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="lg:col-span-2">
        <Label htmlFor="follow-booking">Booking (preferred)</Label>
        <select
          id="follow-booking"
          name="bookingId"
          className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm"
        >
          <option value="">No booking</option>
          {options.bookingOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <Label htmlFor="follow-customer">Customer</Label>
        <select
          id="follow-customer"
          name="customerId"
          className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm"
        >
          <option value="">Select if no booking</option>
          {options.customerOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="follow-title">Task</Label>
        <Input
          id="follow-title"
          name="title"
          required
          className="mt-2"
          placeholder="Confirm deposit with guest"
        />
      </div>
      <div>
        <Label htmlFor="follow-type">Type</Label>
        <select
          id="follow-type"
          name="type"
          className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm"
        >
          <option value="manual">Manual</option>
          <option value="deposit">Deposit</option>
          <option value="arrival">Arrival</option>
          <option value="balance">Balance</option>
          <option value="quote">Quote</option>
        </select>
      </div>
      <div>
        <Label htmlFor="follow-due">Due date</Label>
        <Input id="follow-due" name="dueDate" type="date" required className="mt-2" />
      </div>
      <div>
        <Label htmlFor="follow-priority">Priority</Label>
        <select
          id="follow-priority"
          name="priority"
          className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm"
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div>
        <Label htmlFor="follow-assignee">Assign to</Label>
        <select
          id="follow-assignee"
          name="assignedTo"
          className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm"
        >
          <option value="">Unassigned</option>
          {options.staffOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <BellPlus />}
          {saving ? "Creating…" : "Create follow-up"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-4">
          {error}
        </p>
      )}
    </form>
  );
}
