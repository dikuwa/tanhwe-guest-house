"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateCustomerForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState<{ id: string; name: string }[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setDuplicates([]);

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      whatsapp: String(form.get("whatsapp") ?? ""),
      email: String(form.get("email") ?? ""),
      address: String(form.get("address") ?? ""),
      notes: String(form.get("notes") ?? ""),
    };

    const response = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setSaving(false);

    if (response.ok) {
      router.push(`/admin/customers/${data.id}`);
      router.refresh();
      return;
    }

    if (response.status === 409 && data.duplicates) {
      setDuplicates(data.duplicates);
      setError(data.error ?? "Possible duplicate customer found");
    } else {
      setError(data.error ?? "Could not create customer");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" className="mt-2 h-12" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" className="mt-2 h-12" placeholder="+264 XX XXX XXXX" required />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" type="tel" className="mt-2 h-12" placeholder="Same as phone if same" required />
        </div>
        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" name="email" type="email" className="mt-2 h-12" />
        </div>
        <div>
          <Label htmlFor="address">Address (optional)</Label>
          <Input id="address" name="address" className="mt-2 h-12" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" name="notes" className="mt-2 min-h-24" />
        </div>
      </div>

      {/* Duplicate warning */}
      {duplicates.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <p className="font-medium">{error}</p>
          <p className="mt-1">Existing records with matching contact:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {duplicates.map((d) => (
              <li key={d.id}>{d.name}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            Review the existing records. Submit again to create anyway, or go back to edit the existing customer.
          </p>
        </div>
      )}

      {error && !duplicates.length && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Creating..." : "Create customer"}
        </Button>
      </div>
    </form>
  );
}
