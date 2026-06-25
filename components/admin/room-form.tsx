"use client";

import { FormEvent, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusSelect, roomStatusOptions } from "@/components/forms/status-select";
import { AmenitySelector } from "@/components/forms/amenity-selector";
import { ImageUploader } from "@/components/image-uploader";
import { PREDEFINED_AMENITIES } from "@/lib/amenity-icons";

/** Map DB amenity names to predefined keys for the AmenitySelector */
function amenityNamesToKeys(names: string[]): string[] {
  return names.map((name) => {
    const found = PREDEFINED_AMENITIES.find(
      (a) => a.label.toLowerCase() === name.toLowerCase()
    );
    return found?.key ?? name;
  });
}

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function RoomForm({ room }: { room?: RoomValue }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(room?.status ?? "active");
  const [breakfastIncluded, setBreakfastIncluded] = useState(room?.breakfastIncluded ?? false);
  const [featured, setFeatured] = useState(room?.featured ?? false);
  const [amenities, setAmenities] = useState<string[]>(
    room?.amenities ? amenityNamesToKeys(room.amenities) : []
  );
  const [slug, setSlug] = useState(room?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!slugManuallyEdited && !room?.slug) {
        setSlug(generateSlug(e.target.value));
      }
    },
    [slugManuallyEdited, room?.slug]
  );

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setSlug(e.target.value);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    form.set("status", status);
    form.set("breakfastIncluded", breakfastIncluded ? "on" : "");
    form.set("featured", featured ? "on" : "");
    const payload = {
      name: form.get("name"),
      slug: slug,
      type: form.get("type"),
      description: form.get("description"),
      pricePerNight: Number(form.get("pricePerNight")),
      availableUnits: Number(form.get("availableUnits")),
      maxGuests: Number(form.get("maxGuests")),
      breakfastIncluded: form.get("breakfastIncluded") === "on",
      featured: form.get("featured") === "on",
      status: form.get("status"),
      amenities,
    };
    const response = await fetch(room?.id ? `/api/admin/rooms/${room.id}` : "/api/admin/rooms", {
      method: room?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(data.error ?? "Could not save room");
    toast.success(room?.id ? "Room saved" : "Room created");
    router.push(`/admin/rooms/${room?.id ?? data.id}/edit`);
    router.refresh();
  }

  const isEditing = !!room?.id;

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* ── Basic information ── */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-semibold text-neutral-800">Basic information</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Room name, type, description, and public-facing details.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Room name</Label>
            <Input
              id="name"
              name="name"
              className="mt-2"
              defaultValue={room?.name}
              required
              onChange={handleNameChange}
            />
          </div>
          <div>
            <Label htmlFor="slug">
              URL slug
              {isEditing && (
                <span className="ml-2 text-xs font-normal text-amber-600">
                  (changing this may affect existing links)
                </span>
              )}
            </Label>
            <Input
              id="slug"
              name="slug"
              className="mt-2"
              defaultValue={room?.slug ?? slug}
              value={isEditing ? undefined : slug}
              onChange={handleSlugChange}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Room type</Label>
            <Input
              id="type"
              name="type"
              className="mt-2"
              defaultValue={room?.type}
              placeholder="e.g. double, single, suite"
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <div className="mt-2">
              <StatusSelect
                value={status}
                onValueChange={setStatus}
                options={roomStatusOptions}
                id="status"
              />
            </div>
            <input type="hidden" name="status" value={status} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              className="mt-2 min-h-28"
              defaultValue={room?.description}
            />
          </div>
        </div>
      </section>

      {/* ── Pricing & Inventory ── */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-semibold text-neutral-800">Pricing &amp; inventory</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Rates, availability, and guest capacity.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="pricePerNight">Price per night (N$)</Label>
            <Input
              id="pricePerNight"
              name="pricePerNight"
              type="number"
              min="0"
              className="mt-2"
              defaultValue={room?.pricePerNight ?? 0}
              required
            />
          </div>
          <div>
            <Label htmlFor="availableUnits">Available units</Label>
            <Input
              id="availableUnits"
              name="availableUnits"
              type="number"
              min="1"
              className="mt-2"
              defaultValue={room?.availableUnits ?? 1}
              required
            />
          </div>
          <div>
            <Label htmlFor="maxGuests">Maximum guests</Label>
            <Input
              id="maxGuests"
              name="maxGuests"
              type="number"
              min="1"
              className="mt-2"
              defaultValue={room?.maxGuests ?? 2}
              required
            />
          </div>
          <div className="flex gap-6 sm:col-span-3">
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
        </div>
      </section>

      {/* ── Amenities ── */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-semibold text-neutral-800">Amenities</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Select the amenities available in this room. Icons are displayed automatically.
        </p>
        <div className="mt-5">
          <AmenitySelector value={amenities} onChange={setAmenities} id="amenities" />
        </div>
      </section>

      {/* ── Images ── */}
      {isEditing && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
          <h2 className="text-base font-semibold text-neutral-800">Room images</h2>
          <p className="mb-5 mt-1 text-sm text-neutral-500">
            Upload up to five JPEG, PNG, or WebP images. Drag to reorder. The first image is used
            as the main photo on room cards.
          </p>
          <ImageUploader
            roomId={room.id!}
            existingImages={room.images}
            onImagesUploaded={() => router.refresh()}
          />
        </section>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          {amenities.length > 0 && (
            <>{amenities.length} amenit{amenities.length === 1 ? "y" : "ies"} selected</>
          )}
        </p>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving..." : isEditing ? "Save changes" : "Create room"}
        </Button>
      </div>
    </form>
  );
}
