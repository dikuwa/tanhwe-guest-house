"use client";

import { FormEvent, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function ProfileNameForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(userName);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Name is required");
    if (trimmed === userName) return;
    setSaving(true);
    const response = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(data.error ?? "Could not save");
    toast.success("Profile name updated");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-3">
      <div className="flex-1">
        <Label htmlFor="profile-name">Display name</Label>
        <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11" required />
      </div>
      <Button type="submit" variant="outline" disabled={saving || name.trim() === userName}>
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
