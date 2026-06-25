"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Setting = { id: string; key: string; value: string; description: string | null };

const BOOLEAN_KEYS = new Set([
  "payment_bank_transfer_enabled",
  "payment_mobile_wallets_enabled",
  "document_payment_visible",
]);

const LONG_TEXT_KEYS = new Set([
  "payment_mobile_wallet_description",
  "payment_supported_wallets",
  "physical_address",
  "document_footer_text",
]);

export function CategorizedSettings({
  groups,
}: {
  groups: { key: string; label: string; description: string; settings: Setting[] }[];
}) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <SettingsGroup key={group.key} group={group} />
      ))}
    </div>
  );
}

function SettingsGroup({
  group,
}: {
  group: { key: string; label: string; description: string; settings: Setting[] };
}) {
  if (group.settings.length === 0) return null;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
      <h2 className="font-heading text-lg font-semibold text-neutral-800">{group.label}</h2>
      <p className="mt-1 text-sm text-neutral-500">{group.description}</p>
      <div className="mt-5 divide-y divide-neutral-100">
        {group.settings.map((setting) => (
          <SettingRow key={setting.id} setting={setting} />
        ))}
      </div>
    </section>
  );
}

function SettingRow({ setting }: { setting: Setting }) {
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const body = { key: setting.key, value: String(form.get("value") ?? "") };
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(data.error ?? "Could not save");
    toast.success(`${setting.description ?? setting.key} saved`);
  }

  if (BOOLEAN_KEYS.has(setting.key)) {
    return (
      <form onSubmit={submit} className="flex items-center justify-between gap-4 py-4">
        <div>
          <Label htmlFor={`setting-${setting.key}`} className="text-sm font-medium">
            {setting.description ?? setting.key}
          </Label>
          <p className="text-xs text-neutral-400">{setting.key}</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="hidden" name="key" value={setting.key} />
          <input type="hidden" name="value" id={`setting-${setting.key}-hidden`} value={setting.value === "true" ? "false" : "true"} />
          <Switch
            id={`setting-${setting.key}`}
            checked={setting.value === "true"}
            onCheckedChange={(checked) => {
              // Update the hidden input and submit
              const hidden = document.getElementById(`setting-${setting.key}-hidden`) as HTMLInputElement;
              if (hidden) hidden.value = checked ? "true" : "false";
              // Submit the form
              const form = document.getElementById(`form-${setting.key}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
          />
          <Button type="submit" variant="ghost" size="icon" className="size-8" disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          </Button>
        </div>
      </form>
    );
  }

  if (LONG_TEXT_KEYS.has(setting.key)) {
    return (
      <form id={`form-${setting.key}`} onSubmit={submit} className="grid gap-3 py-4">
        <input type="hidden" name="key" value={setting.key} />
        <div>
          <Label htmlFor={`setting-${setting.key}`}>{setting.description ?? setting.key}</Label>
          <p className="mt-1 text-xs text-neutral-400">{setting.key}</p>
        </div>
        <div className="flex gap-3">
          <Input
            id={`setting-${setting.key}`}
            name="value"
            defaultValue={setting.value}
            required
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="sm" disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form id={`form-${setting.key}`} onSubmit={submit} className="grid gap-3 py-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
      <input type="hidden" name="key" value={setting.key} />
      <div>
        <Label htmlFor={`setting-${setting.key}`}>{setting.description ?? setting.key}</Label>
        <p className="mt-1 text-xs text-neutral-400">{setting.key}</p>
      </div>
      <Input id={`setting-${setting.key}`} name="value" defaultValue={setting.value} required />
      <Button type="submit" variant="outline" size="sm" disabled={saving}>
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
