"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
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
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Room details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
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
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={room?.status ?? "active"}
              className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="blocked">Blocked</option>
            </select>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="breakfastIncluded"
              defaultChecked={room?.breakfastIncluded}
            />{" "}
            Breakfast included
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={room?.featured} /> Feature on
            homepage
          </label>
        </div>
      </section>
      {room?.id && (
        <section className="rounded-xl border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Room images</h2>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">
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
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {saving ? "Saving…" : "Save room"}
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
