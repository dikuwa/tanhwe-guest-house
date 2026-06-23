"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusSelect, roomStatusOptions } from "@/components/forms/status-select";
import { ImageUploader } from "@/components/image-uploader";

type RoomValue = {
  id?: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  pricePerNight: number;
  availableUnits: number;
  maxGuests: number;
  breakfastIncluded: boolean;
  featured: boolean;
  status: string;
  amenities: string[];
  images?: string[];
};

export function RoomForm({ room }: { room?: RoomValue }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(room?.status ?? "active");
  const [breakfastIncluded, setBreakfastIncluded] = useState(room?.breakfastIncluded ?? false);
  const [featured, setFeatured] = useState(room?.featured ?? false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("status", status);
    form.set("breakfastIncluded", breakfastIncluded ? "on" : "");
    form.set("featured", featured ? "on" : "");
    const payload = {
      name: form.get("name"),
      slug: form.get("slug"),
      type: form.get("type"),
      description: form.get("description"),
      pricePerNight: Number(form.get("pricePerNight")),
      availableUnits: Number(form.get("availableUnits")),
      maxGuests: Number(form.get("maxGuests")),
      breakfastIncluded: form.get("breakfastIncluded") === "on",
      featured: form.get("featured") === "on",
      status: form.get("status"),
      amenities: String(form.get("amenities") ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };
    const response = await fetch(room?.id ? `/api/admin/rooms/${room.id}` : "/api/admin/rooms", {
      method: room?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Could not save room");
    router.push(`/admin/rooms/${room?.id ?? data.id}/edit`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-semibold text-neutral-800">Room details</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Public information, inventory, and pricing.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Room name" name="name" defaultValue={room?.name} required />
          <Field
            label="URL slug"
            name="slug"
            defaultValue={room?.slug}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
          />
          <Field label="Room type" name="type" defaultValue={room?.type} required />
          <Field
            label="Price per night (N$)"
            name="pricePerNight"
            type="number"
            min="0"
            defaultValue={room?.pricePerNight ?? 0}
            required
          />
          <Field
            label="Available units"
            name="availableUnits"
            type="number"
            min="1"
            defaultValue={room?.availableUnits ?? 1}
            required
          />
          <Field
            label="Maximum guests"
            name="maxGuests"
            type="number"
            min="1"
            defaultValue={room?.maxGuests ?? 2}
            required
          />
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <StatusSelect
              value={status}
              onValueChange={setStatus}
              options={roomStatusOptions}
              id="status"
            />
            <input type="hidden" name="status" value={status} />
          </div>
          <Field
            label="Amenities (comma separated)"
            name="amenities"
            defaultValue={room?.amenities.join(", ")}
          />
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              className="mt-2 min-h-28"
              defaultValue={room?.description}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <Checkbox
              checked={breakfastIncluded}
              onCheckedChange={(v) => setBreakfastIncluded(Boolean(v))}
            />
            Breakfast included
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <Checkbox
              checked={featured}
              onCheckedChange={(v) => setFeatured(Boolean(v))}
            />
            Feature on homepage
          </label>
        </div>
      </section>
      {room?.id && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
          <h2 className="text-base font-semibold text-neutral-800">Room images</h2>
          <p className="mb-5 mt-1 text-sm text-neutral-500">
            Upload up to five JPEG, PNG, or WebP images.
          </p>
          <ImageUploader
            roomId={room.id}
            existingImages={room.images}
            onImagesUploaded={() => router.refresh()}
          />
        </section>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving..." : "Save room"}
        </Button>
      </div>
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
