"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { GripVertical, Loader2, Star, Trash2, Upload, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ConferenceImage = {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

interface Props {
  initialImages: ConferenceImage[];
}

export function ConferenceImagesManager({ initialImages }: Props) {
  const [images, setImages] = useState<ConferenceImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const available = 5 - images.length;
    if (files.length > available) {
      toast.error(`Only ${available} more image${available === 1 ? "" : "s"} allowed (max 5)`);
      return;
    }

    setUploading(true);
    setUploadTotal(files.length);

    try {
      const added: ConferenceImage[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadIndex(i);
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("path", "conference");

        const uploadRes = await fetch("/api/admin/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error ?? "Upload failed");
        }

        const { imageUrl } = await uploadRes.json();

        const saveRes = await fetch("/api/admin/conference/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });

        if (!saveRes.ok) {
          throw new Error("Failed to save image record");
        }

        const { id } = await saveRes.json();
        added.push({ id, imageUrl, altText: null, sortOrder: 0, isPrimary: false });
      }

      toast.success(`${added.length} image${added.length === 1 ? "" : "s"} added`);
      setImages((prev) => {
        const next = [...prev, ...added];
        if (prev.length === 0 && added.length > 0) {
          next[0] = { ...next[0], isPrimary: true };
        }
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadIndex(null);
      setUploadTotal(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete
  const handleDelete = async (index: number) => {
    const image = images[index];
    if (!confirm("Remove this image?")) return;

    const res = await fetch("/api/admin/conference/images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: image.imageUrl }),
    });

    if (!res.ok) {
      toast.error("Failed to delete image");
      return;
    }

    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    toast.success("Image removed");
  };

  // Set as primary
  const setPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setImages(updated);
    saveOrder(updated);
  };

  // Save order
  const saveOrder = async (imgs: ConferenceImage[]) => {
    try {
      await fetch("/api/admin/conference/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: imgs.map((i) => i.imageUrl) }),
      });
      toast.success("Order saved");
    } catch {
      toast.error("Failed to save order");
    }
  };

  // Drag and drop
  const handleDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      requestAnimationFrame(() => {
        (e.target as HTMLElement).classList.add("opacity-40");
      });
    },
    []
  );

  const handleDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragIndex === null || dragIndex === index) return;
      const updated = [...imagesRef.current];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      setDragIndex(index);
      setImages(updated);
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      (e.target as HTMLElement).classList.remove("opacity-40");
      setDragIndex(null);
      saveOrder(imagesRef.current);
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDragEnd={handleDragEnd}
            className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 active:cursor-grabbing"
          >
            <Image
              src={image.imageUrl}
              alt={image.altText ?? `Conference image ${index + 1}`}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="pointer-events-none object-cover"
            />
            <div className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical className="size-3.5" />
            </div>
            {image.isPrimary && (
              <div className="absolute bottom-1.5 left-1.5 rounded-md bg-primary/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Lead
              </div>
            )}
            <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!image.isPrimary && (
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  aria-label="Set as lead image"
                  title="Set as lead image"
                  className="flex size-6 items-center justify-center rounded-md bg-black/40 text-white hover:bg-black/60"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(index)}
                aria-label="Remove image"
                title="Remove image"
                className="flex size-6 items-center justify-center rounded-md bg-red-600/80 text-white hover:bg-red-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload button */}
        {images.length < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square cursor-pointer rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 bg-neutral-50 transition-colors hover:bg-neutral-100"
          >
            {uploading ? (
              <Loader2 className="size-8 animate-spin text-primary" />
            ) : (
              <Upload className="size-8 text-neutral-400" />
            )}
            <span className="text-sm text-neutral-400">
              {images.length === 0 ? "Add image" : "Add more"}
            </span>
          </button>
        )}
      </div>

      {uploading && (
        <div className="text-center text-sm text-neutral-500">
          Uploading {uploadIndex !== null ? uploadIndex + 1 : 0} of {uploadTotal}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />

      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>Supported: JPEG, PNG, WebP (max 5MB each)</span>
        <span>Drag to reorder &middot; {images.length} / 5</span>
      </div>

    </div>
  );
}
