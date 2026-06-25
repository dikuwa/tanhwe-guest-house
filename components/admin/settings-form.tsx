"use client";
import { FormEvent } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type Setting = { id: string; key: string; value: string; description: string | null };
export function SettingsForm({ settings }: { settings: Setting[] }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error ?? "Could not save");
    toast.success("Setting saved");
  }
  return (
    <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-xs">
      {settings.map((setting) => (
        <form
          key={setting.id}
          onSubmit={submit}
          className="grid gap-3 p-5 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"
        >
          <input type="hidden" name="key" value={setting.key} />
          <div>
            <Label htmlFor={`setting-${setting.key}`}>{setting.description ?? setting.key}</Label>
            <p className="mt-1 text-xs text-neutral-400">{setting.key}</p>
          </div>
          <Input id={`setting-${setting.key}`} name="value" defaultValue={setting.value} required className="h-12" />
          <Button type="submit" variant="outline" size="sm">
            <Save className="size-3.5" />
            Save
          </Button>
        </form>
      ))}
    </div>
  );
}
