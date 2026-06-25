"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { GripVertical, Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface ImageUploaderProps {
  roomId: string;
  onImagesUploaded: (urls: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
}

export function ImageUploader({
  roomId,
  onImagesUploaded,
  existingImages = [],
  maxImages = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingImages);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>(existingImages);

  // Keep the ref in sync with state
  const updateUrls = (next: string[]) => {
    urlsRef.current = next;
    setPreviewUrls(next);
  };

  // ── Upload ──────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (previewUrls.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setUploadTotal(files.length);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadingIndex(i);
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("roomId", roomId);

        const response = await fetch("/api/admin/rooms/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        uploadedUrls.push(data.imageUrl);
      }

      const newUrls = [...urlsRef.current, ...uploadedUrls];
      updateUrls(newUrls);
      onImagesUploaded(newUrls);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
      setUploadingIndex(null);
      setUploadTotal(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ── Remove ──────────────────────────────────────────────

  const removeImage = async (index: number) => {
    const imageUrl = previewUrls[index];
    const response = await fetch("/api/admin/rooms/upload-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });
    if (!response.ok) {
      toast.error("Failed to delete image");
      return;
    }
    const newUrls = urlsRef.current.filter((_, i) => i !== index);
    updateUrls(newUrls);
    onImagesUploaded(newUrls);
  };

  // ── Set as primary ──────────────────────────────────────

  const setPrimary = async (index: number) => {
    const urls = [...urlsRef.current];
    const [target] = urls.splice(index, 1);
    urls.unshift(target); // Move to front
    updateUrls(urls);

    // Persist the new order on the server
    await saveOrder(urls);

    // Mark the first image as primary implicitly via its position
    onImagesUploaded(urls);
  };

  // ── Drag-and-drop reorder ───────────────────────────────

  const saveOrder = async (urls: string[]) => {
    try {
      await fetch(`/api/admin/rooms/${roomId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: urls }),
      });
    } catch (error) {
      console.error("Failed to save image order:", error);
    }
  };

  const handleDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Slight delay so the visual feedback is crisp
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
      const urls = [...urlsRef.current];
      const [moved] = urls.splice(dragIndex, 1);
      urls.splice(index, 0, moved);
      setDragIndex(index);
      updateUrls(urls);
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      (e.target as HTMLElement).classList.remove("opacity-40");
      setDragIndex(null);
      // Read from ref to get the latest array (avoids stale closure)
      const finalOrder = urlsRef.current;
      saveOrder(finalOrder);
      onImagesUploaded(finalOrder);
    },
    [onImagesUploaded]
  );

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {previewUrls.map((url, index) => (
          <div
            key={url}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDragEnd={handleDragEnd}
            className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 active:cursor-grabbing"
          >
            <Image
              src={url}
              alt={`Room image ${index + 1}`}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="pointer-events-none object-cover"
            />

            {/* Drag handle */}
            <div className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical className="size-3.5" />
            </div>

            {/* Image number badge */}
            {index === 0 && (
              <div className="absolute bottom-1.5 left-1.5 rounded-md bg-primary/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Primary
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {/* Set as primary (unless already primary) */}
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  aria-label={`Set image ${index + 1} as primary`}
                  title="Set as primary"
                  className="flex size-6 items-center justify-center rounded-md bg-black/40 text-white hover:bg-black/60"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setRemoveIndex(index)}
                aria-label={`Remove image ${index + 1}`}
                title="Remove image"
                className="flex size-6 items-center justify-center rounded-md bg-red-600/80 text-white hover:bg-red-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

            {/* Drop indicator */}
            {dragIndex !== null && dragIndex !== index && (
              <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary/60" />
            )}
          </div>
        ))}

        {/* Upload button */}
        {previewUrls.length < maxImages && (
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
              {previewUrls.length === 0 ? "Add image" : "Add more"}
            </span>
          </button>
        )}
      </div>

      <ConfirmDialog
        open={removeIndex !== null}
        onOpenChange={(v) => { if (!v) setRemoveIndex(null); }}
        title="Remove image?"
        description="This will permanently delete this image. This action cannot be undone."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={async () => {
          if (removeIndex !== null) await removeImage(removeIndex);
          setRemoveIndex(null);
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {uploading && (
        <div className="text-center text-sm text-neutral-500">
          Uploading {uploadingIndex !== null ? uploadingIndex + 1 : 0} of {uploadTotal}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>Supported formats: JPEG, PNG, WebP (max 5MB each)</span>
        {previewUrls.length > 0 && (
          <span className="text-neutral-500">
            Drag images to reorder &middot; {previewUrls.length} / {maxImages}
          </span>
        )}
      </div>
    </div>
  );
}
