"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit3, GripVertical, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type RoomType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bedConfiguration: string | null;
  pricePerNight: number;
  maxGuests: number;
  breakfastIncluded: boolean;
  sortOrder: number;
  status: string;
};

export function RoomTypesManager({ initial }: { initial: RoomType[] }) {
  const router = useRouter();
  const [types, setTypes] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return toast.error("Room type name is required");
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      name,
      slug,
      description: String(form.get("description") ?? "").trim(),
      bedConfiguration: String(form.get("bedConfiguration") ?? "").trim(),
      pricePerNight: Number(form.get("pricePerNight")),
      maxGuests: Number(form.get("maxGuests")),
      breakfastIncluded: form.get("breakfastIncluded") === "on",
      sortOrder: types.length + 1,
      status: "active",
    };
    setSaving("new");
    const response = await fetch("/api/admin/room-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) return toast.error(data.error ?? "Could not create room type");
    toast.success(`${name} is now available in room forms.`);
    setShowCreate(false);
    setCreateName("");
    router.refresh();
  }

  async function handleUpdate(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return toast.error("Room type name is required");
    const slug = String(form.get("slug") ?? "").trim();
    const payload = {
      name,
      slug,
      description: String(form.get("description") ?? "").trim(),
      bedConfiguration: String(form.get("bedConfiguration") ?? "").trim(),
      pricePerNight: Number(form.get("pricePerNight")),
      maxGuests: Number(form.get("maxGuests")),
      breakfastIncluded: form.get("breakfastIncluded") === "on",
      sortOrder: Number(form.get("sortOrder")),
      status: String(form.get("status")),
    };
    setSaving(id);
    const response = await fetch(`/api/admin/room-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) return toast.error(data.error ?? "Could not update room type");
    toast.success(`${name} updated`);
    setEditing(null);
    router.refresh();
  }

  async function handleArchive(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const label = newStatus === "inactive" ? "Archive" : "Activate";
    setSaving(id);
    const type = types.find((t) => t.id === id);
    const response = await fetch(`/api/admin/room-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: type!.name,
        slug: type!.slug,
        description: type!.description ?? "",
        bedConfiguration: type!.bedConfiguration ?? "",
        pricePerNight: type!.pricePerNight,
        maxGuests: type!.maxGuests,
        breakfastIncluded: type!.breakfastIncluded,
        sortOrder: type!.sortOrder,
        status: newStatus,
      }),
    });
    setSaving(null);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(data.error ?? `Could not ${label.toLowerCase()} room type`);
    toast.success(`${type!.name} ${label.toLowerCase()}d`);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const type = types.find((t) => t.id === id);
    if (!confirm(`Delete "${type!.name}"? This cannot be undone.`)) return;
    setSaving(id);
    const response = await fetch(`/api/admin/room-types/${id}`, { method: "DELETE" });
    setSaving(null);
    if (!response.ok) {
      const data = await response.json();
      return toast.error(data.error ?? "Could not delete room type", { description: data.detail });
    }
    toast.success("Room type deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {types.length === 0 && !showCreate && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
          <p className="text-sm text-muted-foreground">No room types have been added yet.</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="size-4" />
            Add room type
          </Button>
        </div>
      )}

      {types.map((type) => (
        <div key={type.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
          {editing === type.id ? (
            <form onSubmit={(e) => handleUpdate(type.id, e)} className="space-y-4">
              <input type="hidden" name="sortOrder" value={type.sortOrder} />
              <input type="hidden" name="status" value={type.status} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`edit-name-${type.id}`}>Name</Label>
                  <Input id={`edit-name-${type.id}`} name="name" defaultValue={type.name} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor={`edit-slug-${type.id}`}>Slug</Label>
                  <Input id={`edit-slug-${type.id}`} name="slug" defaultValue={type.slug} className="mt-1" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
                </div>
                <div>
                  <Label htmlFor={`edit-price-${type.id}`}>Default price (N$)</Label>
                  <Input id={`edit-price-${type.id}`} name="pricePerNight" type="number" min="0" defaultValue={type.pricePerNight} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor={`edit-guests-${type.id}`}>Max guests</Label>
                  <Input id={`edit-guests-${type.id}`} name="maxGuests" type="number" min="1" defaultValue={type.maxGuests} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor={`edit-bed-${type.id}`}>Bed configuration</Label>
                  <Input id={`edit-bed-${type.id}`} name="bedConfiguration" defaultValue={type.bedConfiguration ?? ""} className="mt-1" placeholder="e.g. 1 double bed" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox name="breakfastIncluded" defaultChecked={type.breakfastIncluded} />
                    Breakfast included
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`edit-desc-${type.id}`}>Description</Label>
                  <Textarea id={`edit-desc-${type.id}`} name="description" defaultValue={type.description ?? ""} className="mt-1" rows={2} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving === type.id}>
                  {saving === type.id ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Save
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  <X className="size-3.5" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-neutral-800">{type.name}</h3>
                  {type.status !== "active" && (
                    <Badge variant="outline" className="text-xs text-neutral-400">Archived</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {type.bedConfiguration ?? "—"} &middot; N${type.pricePerNight}/night &middot; Up to {type.maxGuests} guest{type.maxGuests === 1 ? "" : "s"}
                </p>
                {type.description && (
                  <p className="mt-1 text-sm text-neutral-600">{type.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(type.id)} title="Edit">
                  <Edit3 className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => handleArchive(type.id, type.status)} title={type.status === "active" ? "Archive" : "Activate"} disabled={saving === type.id}>
                  {saving === type.id ? <Loader2 className="size-3.5 animate-spin" /> : type.status === "active" ? <Trash2 className="size-3.5 text-neutral-400" /> : <Check className="size-3.5 text-emerald-500" />}
                </Button>
                <Button variant="ghost" size="icon" className="size-8 text-red-500" onClick={() => handleDelete(type.id)} title="Delete permanently" disabled={saving === type.id}>
                  {saving === type.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-xl border border-dashed border-primary/40 bg-primary/[0.02] p-5 shadow-xs sm:p-6">
          <h3 className="font-semibold text-neutral-800">New room type</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-name">Name</Label>
              <Input id="new-name" name="name" value={createName} onChange={(e) => setCreateName(e.target.value)} className="mt-1" placeholder="e.g. Standard Twin Room" required />
            </div>
            <div>
              <Label htmlFor="new-price">Default price (N$)</Label>
              <Input id="new-price" name="pricePerNight" type="number" min="0" defaultValue="0" className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="new-guests">Max guests</Label>
              <Input id="new-guests" name="maxGuests" type="number" min="1" defaultValue="2" className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="new-bed">Bed configuration</Label>
              <Input id="new-bed" name="bedConfiguration" className="mt-1" placeholder="e.g. 1 double bed" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="new-desc">Description</Label>
              <Textarea id="new-desc" name="description" className="mt-1" rows={2} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox name="breakfastIncluded" />
                Breakfast included by default
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving === "new"}>
              {saving === "new" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create room type
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setCreateName(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!showCreate && types.length > 0 && (
        <Button variant="outline" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          Add room type
        </Button>
      )}
    </div>
  );
}
