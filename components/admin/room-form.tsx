"use client";

import { FormEvent, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusSelect, roomStatusOptions } from "@/components/forms/status-select";
import { RoomAmenitiesSelector } from "@/components/forms/room-amenities-selector";
import { ImageUploader } from "@/components/image-uploader";
import { PREDEFINED_AMENITIES } from "@/lib/amenity-icons";

type RoomTypeOption = {
  id: string;
  name: string;
  slug: string;
  bedConfiguration: string | null;
  pricePerNight: number;
  maxGuests: number;
  breakfastIncluded: boolean;
};

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
  roomTypeId?: string | null;
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

export function RoomForm({
  room,
  roomTypes,
}: {
  room?: RoomValue;
  roomTypes: RoomTypeOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(room?.status ?? "active");
  const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId ?? "");
  const [breakfastIncluded, setBreakfastIncluded] = useState(room?.breakfastIncluded ?? false);
  const [featured, setFeatured] = useState(room?.featured ?? false);
  const [amenities, setAmenities] = useState<string[]>(
    room?.amenities ? amenityNamesToKeys(room.amenities) : []
  );
  const [slug, setSlug] = useState(room?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [pricePerNight, setPricePerNight] = useState(room?.pricePerNight ?? 0);
  const [maxGuests, setMaxGuests] = useState(room?.maxGuests ?? 2);
  const [fieldsCustomized, setFieldsCustomized] = useState(!!room?.id);
  const [showNewTypeDialog, setShowNewTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeSlug, setNewTypeSlug] = useState("");
  const [creatingType, setCreatingType] = useState(false);

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

  const selectedType = roomTypes.find((rt) => rt.id === roomTypeId);

  function handleRoomTypeChange(value: string) {
    if (value === "__add_new__") {
      setShowNewTypeDialog(true);
      return;
    }
    setRoomTypeId(value);
    const rt = roomTypes.find((t) => t.id === value);
    if (!rt) return;
    if (!fieldsCustomized) {
      setPricePerNight(rt.pricePerNight);
      setMaxGuests(rt.maxGuests);
      setBreakfastIncluded(rt.breakfastIncluded);
    } else {
      toast.warning("Existing values detected", {
        description: `Applying the defaults from "${rt.name}" will replace the current room values.`,
        action: {
          label: "Apply defaults",
          onClick: () => {
            setPricePerNight(rt.pricePerNight);
            setMaxGuests(rt.maxGuests);
            setBreakfastIncluded(rt.breakfastIncluded);
            toast.success(`Defaults from "${rt.name}" applied`);
          },
        },
      });
    }
  }

  async function handleCreateType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newTypeName.trim();
    if (!name) return toast.error("Room type name is required");
    const slug = newTypeSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      name,
      slug,
      bedConfiguration: "",
      pricePerNight: Number(new FormData(event.currentTarget).get("newTypePrice")),
      maxGuests: Number(new FormData(event.currentTarget).get("newTypeGuests")),
      sortOrder: roomTypes.length + 1,
      status: "active",
    };
    setCreatingType(true);
    const response = await fetch("/api/admin/room-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setCreatingType(false);
    if (!response.ok) return toast.error(data.error ?? "Could not create room type");
    toast.success(`${name} created`);
    setShowNewTypeDialog(false);
    setNewTypeName("");
    setNewTypeSlug("");
    setRoomTypeId(data.id);
    setFieldsCustomized(true);
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    form.set("status", status);
    form.set("breakfastIncluded", breakfastIncluded ? "on" : "");
    form.set("featured", featured ? "on" : "");
    const typeText = selectedType?.name ?? form.get("type") ?? "";
    const payload = {
      name: form.get("name"),
      slug: slug,
      type: typeText,
      roomTypeId: roomTypeId || null,
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
    if (room?.id) {
      toast.success("Room saved", {
        action: { label: "Back to rooms", onClick: () => router.push("/admin/rooms") },
      });
      router.refresh();
    } else {
      toast.success("Room created", {
        action: { label: "View room", onClick: () => router.push(`/admin/rooms/${data.id}/edit`) },
      });
      router.push(`/admin/rooms/${data.id}/edit`);
      router.refresh();
    }
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
              className="mt-2 h-11"
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
              className="mt-2 h-11"
              defaultValue={room?.slug ?? slug}
              value={isEditing ? undefined : slug}
              onChange={handleSlugChange}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
          </div>
          <div>
            <Label htmlFor="roomType">Room type</Label>
            <div className="mt-2">
              {showNewTypeDialog ? (
                <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/[0.02] p-4">
                  <p className="text-sm font-medium">Create new room type</p>
                  <form onSubmit={handleCreateType} className="space-y-3">
                    <div>
                      <Label htmlFor="newTypeName">Type name</Label>
                      <Input
                        id="newTypeName"
                        value={newTypeName}
                        onChange={(e) => {
                          setNewTypeName(e.target.value);
                          setNewTypeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                        }}
                        className="mt-1 h-11"
                        placeholder="e.g. Standard Twin Room"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="newTypePrice">Default price (N$)</Label>
                        <Input id="newTypePrice" name="newTypePrice" type="number" min="0" defaultValue="0" className="mt-1 h-11" required />
                      </div>
                      <div>
                        <Label htmlFor="newTypeGuests">Max guests</Label>
                        <Input id="newTypeGuests" name="newTypeGuests" type="number" min="1" defaultValue="2" className="mt-1 h-11" required />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={creatingType}>
                        {creatingType ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                        Create &amp; select
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewTypeDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <Select
                  value={roomTypeId}
                  onValueChange={(value) => {
                    if (value === "__add_new__") {
                      setShowNewTypeDialog(true);
                    } else {
                      if (value) handleRoomTypeChange(value);
                    }
                  }}
                >
                  <SelectTrigger id="roomType" className="h-11 w-full">
                    <SelectValue placeholder="Select a room type">
                      {selectedType ? selectedType.name : "Select a room type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        No room types available
                      </SelectItem>
                    )}
                    {roomTypes.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id}>
                        <span className="font-medium">{rt.name}</span>
                        {rt.bedConfiguration && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {rt.bedConfiguration} &middot; Up to {rt.maxGuests} guests
                          </span>
                        )}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="text-primary font-medium border-t border-neutral-200 mt-1 pt-2">
                      <Plus className="mr-1 inline size-3.5" />
                      Add new room type
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
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
          Rates, availability, guest capacity, and the bed configuration.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="pricePerNight">
              Price per night (N$)
              {selectedType && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  default: N${selectedType.pricePerNight}
                </span>
              )}
            </Label>
            <Input
              id="pricePerNight"
              name="pricePerNight"
              type="number"
              min="0"
              className="mt-2 h-11"
              value={pricePerNight}
              onChange={(e) => {
                setPricePerNight(Number(e.target.value));
                setFieldsCustomized(true);
              }}
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
              className="mt-2 h-11"
              defaultValue={room?.availableUnits ?? 1}
              required
            />
          </div>
          <div>
            <Label htmlFor="maxGuests">
              Maximum guests
              {selectedType && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  default: {selectedType.maxGuests}
                </span>
              )}
            </Label>
            <Input
              id="maxGuests"
              name="maxGuests"
              type="number"
              min="1"
              className="mt-2 h-11"
              value={maxGuests}
              onChange={(e) => {
                setMaxGuests(Number(e.target.value));
                setFieldsCustomized(true);
              }}
              required
            />
          </div>
          <div className="flex gap-6 sm:col-span-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
              <Checkbox
                checked={breakfastIncluded}
                onCheckedChange={(v) => {
                  setBreakfastIncluded(Boolean(v));
                  setFieldsCustomized(true);
                }}
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
        <h2 className="text-base font-semibold text-neutral-800">Room Amenities</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Choose the amenities available for this room.
        </p>
        <div className="mt-5">
          <RoomAmenitiesSelector value={amenities} onChange={setAmenities} id="amenities" />
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

      <div className="flex items-center justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving..." : isEditing ? "Save changes" : "Create room"}
        </Button>
      </div>
    </form>
  );
}
