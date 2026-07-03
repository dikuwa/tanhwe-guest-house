"use client";

import { FormEvent, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Loader2, Plus, Save, Star, Trash2, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
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
  description: string | null;
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

const MAX_IMAGES = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function RoomForm({
  room,
  roomTypes: initialRoomTypes,
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
  const [description, setDescription] = useState(room?.description ?? "");
  const [fieldsCustomized, setFieldsCustomized] = useState(!!room?.id);
  const [showNewTypeDialog, setShowNewTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeSlug, setNewTypeSlug] = useState("");
  const [newTypePrice, setNewTypePrice] = useState(0);
  const [newTypeGuests, setNewTypeGuests] = useState(2);
  const [newTypeBedConfig, setNewTypeBedConfig] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [newTypeBreakfast, setNewTypeBreakfast] = useState(false);
  const [creatingType, setCreatingType] = useState(false);
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes);

  // New-room image state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [pendingPrimaryIndex, setPendingPrimaryIndex] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const isEditing = !!room?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setDescription(rt.description ?? "");
    } else {
      toast("Existing values detected — Applying the defaults from \"" + rt.name + "\" will replace the current room values.");
    }
  }

  async function handleCreateType() {
    const name = newTypeName.trim();
    if (!name) return toast.error("Room type name is required");
    const slug = newTypeSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      name,
      slug,
      description: newTypeDescription.trim(),
      bedConfiguration: newTypeBedConfig.trim(),
      pricePerNight: newTypePrice,
      maxGuests: newTypeGuests,
      breakfastIncluded: newTypeBreakfast,
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
    setRoomTypes((current) => [
      ...current,
      {
        id: data.id,
        name,
        slug,
        description: payload.description || null,
        bedConfiguration: payload.bedConfiguration || null,
        pricePerNight: payload.pricePerNight,
        maxGuests: payload.maxGuests,
        breakfastIncluded: payload.breakfastIncluded,
      },
    ]);
    setShowNewTypeDialog(false);
    setNewTypeName("");
    setNewTypeSlug("");
    setNewTypePrice(0);
    setNewTypeGuests(2);
    setNewTypeBedConfig("");
    setNewTypeDescription("");
    setNewTypeBreakfast(false);
    setRoomTypeId(data.id);
    setPricePerNight(payload.pricePerNight);
    setMaxGuests(payload.maxGuests);
    setBreakfastIncluded(payload.breakfastIncluded);
    setDescription((current) => (current.trim() ? current : payload.description));
    setFieldsCustomized(true);
  }

  // ── Image handling for new rooms ──

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (pendingFiles.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 5 MB limit`);
        return;
      }
    }
    const newFiles = [...pendingFiles, ...files];
    const newPreviews = [
      ...pendingPreviews,
      ...files.map((f) => URL.createObjectURL(f)),
    ];
    setPendingFiles(newFiles);
    setPendingPreviews(newPreviews);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePendingImage(index: number) {
    URL.revokeObjectURL(pendingPreviews[index]);
    const newFiles = pendingFiles.filter((_, i) => i !== index);
    const newPreviews = pendingPreviews.filter((_, i) => i !== index);
    setPendingFiles(newFiles);
    setPendingPreviews(newPreviews);
    if (pendingPrimaryIndex >= newFiles.length) {
      setPendingPrimaryIndex(Math.max(0, newFiles.length - 1));
    }
  }

  function reorderPending(fromIndex: number, toIndex: number) {
    const newFiles = [...pendingFiles];
    const newPreviews = [...pendingPreviews];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    const [movedPreview] = newPreviews.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    newPreviews.splice(toIndex, 0, movedPreview);
    setPendingFiles(newFiles);
    setPendingPreviews(newPreviews);
    if (pendingPrimaryIndex === fromIndex) {
      setPendingPrimaryIndex(toIndex);
    }
  }

  // ── Submit ──

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    form.set("status", status);
    form.set("breakfastIncluded", breakfastIncluded ? "on" : "");
    form.set("featured", featured ? "on" : "");
    const typeText = selectedType?.name ?? room?.type ?? "";
    if (!typeText || typeText.trim().length < 2) {
      setSaving(false);
      return toast.error("Please select a room type before saving");
    }
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

    if (room?.id) {
      // ── Edit mode ──
      const response = await fetch(`/api/admin/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setSaving(false);
        return toast.error(data.error ?? "Could not save room");
      }
      toast.success("Room saved");
      router.refresh();
      setSaving(false);
    } else {
      // ── Create mode (one-submission with images) ──
      try {
        const response = await fetch("/api/admin/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          setSaving(false);
          return toast.error(data.error ?? "Could not create room");
        }

        const newRoomId = data.id;

        // Upload images if any
        if (pendingFiles.length > 0) {
          setImageUploading(true);
          const uploadedUrls: string[] = [];
          try {
            for (let i = 0; i < pendingFiles.length; i++) {
              const formData = new FormData();
              formData.append("file", pendingFiles[i]);
              formData.append("roomId", newRoomId);
              const uploadRes = await fetch("/api/admin/rooms/upload-image", {
                method: "POST",
                body: formData,
              });
              if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error ?? `Failed to upload image ${i + 1}`);
              }
              const { imageUrl } = await uploadRes.json();
              uploadedUrls.push(imageUrl);
            }

            // Set primary image and order
            if (uploadedUrls.length > 0) {
              const ordered = [
                uploadedUrls[pendingPrimaryIndex],
                ...uploadedUrls.filter((_, i) => i !== pendingPrimaryIndex),
              ];
              await fetch(`/api/admin/rooms/${newRoomId}/images`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrls: ordered }),
              });
            }
          } catch (uploadError) {
            // Image upload failed — roll back the room
            await fetch(`/api/admin/rooms/${newRoomId}`, { method: "DELETE" }).catch(() => {});
            setSaving(false);
            setImageUploading(false);
            toast.error(
              uploadError instanceof Error ? uploadError.message : "Failed to upload images"
            );
            return;
          }
          setImageUploading(false);
        }

        toast.success("Room created");
        router.push(`/admin/rooms/${newRoomId}/edit`);
        router.refresh();
      } catch (error) {
        setSaving(false);
        toast.error("An unexpected error occurred");
        return;
      }
    }
  }

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
                  <div className="space-y-3">
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
                        <Input
                          id="newTypePrice"
                          type="number"
                          min="0"
                          value={newTypePrice}
                          onChange={(e) => setNewTypePrice(Number(e.target.value))}
                          className="mt-1 h-11"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newTypeGuests">Max guests</Label>
                        <Input
                          id="newTypeGuests"
                          type="number"
                          min="1"
                          value={newTypeGuests}
                          onChange={(e) => setNewTypeGuests(Number(e.target.value))}
                          className="mt-1 h-11"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newTypeBedConfig">Bed configuration</Label>
                        <Input
                          id="newTypeBedConfig"
                          value={newTypeBedConfig}
                          onChange={(e) => setNewTypeBedConfig(e.target.value)}
                          className="mt-1 h-11"
                          placeholder="e.g. 1 double bed"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={newTypeBreakfast}
                            onCheckedChange={(checked) => setNewTypeBreakfast(checked === true)}
                          />
                          Breakfast included
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="newTypeDescription">Description</Label>
                      <Textarea
                        id="newTypeDescription"
                        value={newTypeDescription}
                        onChange={(e) => setNewTypeDescription(e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={creatingType}
                        onClick={handleCreateType}
                      >
                        {creatingType ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                        Create &amp; select
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewTypeDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Select
                  value={roomTypeId}
                  onValueChange={(value) => {
                    if (value) handleRoomTypeChange(value);
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
                  </SelectContent>
                </Select>
              )}
              {!showNewTypeDialog && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 px-0 text-primary hover:bg-transparent hover:text-primary/80"
                  onClick={() => setShowNewTypeDialog(true)}
                >
                  <Plus className="size-3.5" />
                  Add new room type
                </Button>
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
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFieldsCustomized(true);
              }}
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
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="text-base font-semibold text-neutral-800">Room images</h2>
        <p className="mb-5 mt-1 text-sm text-neutral-500">
          Upload up to five JPEG, PNG, or WebP images. The first image is used as the main photo on
          room cards.
          {!isEditing && (
            <span className="block text-amber-600">
              Images are uploaded after the room is created. If the upload fails, the room will not be created.
            </span>
          )}
        </p>

        {isEditing ? (
          <ImageUploader
            roomId={room.id!}
            existingImages={room.images}
            onImagesUploaded={() => router.refresh()}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {pendingPreviews.map((url, index) => (
                <div
                  key={url}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50"
                >
                  <img
                    src={url}
                    alt={`Selected image ${index + 1}`}
                    className="size-full object-cover"
                  />
                  <div className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="size-3.5" />
                  </div>
                  {index === pendingPrimaryIndex && (
                    <div className="absolute bottom-1.5 left-1.5 rounded-md bg-primary/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Primary
                    </div>
                  )}
                  <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => setPendingPrimaryIndex(index)}
                        aria-label="Set as primary"
                        title="Set as primary"
                        className="flex size-6 items-center justify-center rounded-md bg-black/40 text-white hover:bg-black/60"
                      >
                        <Star className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePendingImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                      title="Remove image"
                      className="flex size-6 items-center justify-center rounded-md bg-red-600/80 text-white hover:bg-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {pendingPreviews.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="aspect-square cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 bg-neutral-50 transition-colors hover:bg-neutral-100"
                >
                  <Upload className="size-8 text-neutral-400" />
                  <span className="text-sm text-neutral-400">
                    {pendingPreviews.length === 0 ? "Add image" : "Add more"}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={saving}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
              <span>Supported formats: JPEG, PNG, WebP (max 5 MB each)</span>
              {pendingPreviews.length > 0 && (
                <span>{pendingPreviews.length} / {MAX_IMAGES}</span>
              )}
            </div>
          </>
        )}
      </section>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {imageUploading && (
            <span className="flex items-center gap-2 text-amber-600">
              <Loader2 className="size-4 animate-spin" />
              Uploading images…
            </span>
          )}
        </div>
        <Button type="submit" size="lg" disabled={saving || imageUploading}>
          {saving || imageUploading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {imageUploading ? "Uploading images…" : saving ? "Saving..." : isEditing ? "Save changes" : "Create room"}
        </Button>
      </div>
    </form>
  );
}
