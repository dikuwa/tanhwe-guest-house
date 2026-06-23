"use client";

import { FormEvent, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Customer = {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
  idOrPassport: string | null;
  notes: string | null;
};

export function CustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/admin/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    setMessage(response.ok ? "Customer details saved." : (data.error ?? "Could not save customer"));
    if (response.ok) router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="fullName" defaultValue={customer.fullName} required />
        <Field label="Phone" name="phone" defaultValue={customer.phone} required />
        <Field label="WhatsApp" name="whatsapp" defaultValue={customer.whatsapp} required />
        <Field label="Email" name="email" type="email" defaultValue={customer.email ?? ""} />
        <Field label="Address" name="address" defaultValue={customer.address ?? ""} />
        <Field
          label="ID or passport (only when required)"
          name="idOrPassport"
          defaultValue={customer.idOrPassport ?? ""}
        />
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Internal notes</Label>
          <Textarea
            id="notes"
            name="notes"
            className="mt-2 min-h-28"
            defaultValue={customer.notes ?? ""}
          />
        </div>
      </div>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : <Save />}
        {saving ? "Saving…" : "Save customer"}
      </Button>
    </form>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, ...input } = props;
  return (
    <div>
      <Label htmlFor={String(input.name)}>{label}</Label>
      <Input id={String(input.name)} className="mt-2" {...input} />
    </div>
  );
}
