"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";

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
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (previewUrls.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
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
        setPreviewUrls((prev) => [...prev, data.imageUrl]);
      }

      onImagesUploaded(previewUrls);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
      setUploadingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newUrls);
    onImagesUploaded(newUrls);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previewUrls.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={url}
              alt={`Room image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {previewUrls.length < maxImages && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {previewUrls.length === 0 ? "Add image" : "Add more"}
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
        disabled={uploading}
      />

      {uploading && (
        <div className="text-sm text-muted-foreground text-center">
          Uploading {uploadingIndex !== null ? uploadIndex + 1 : 0} of{" "}
          {previewUrls.length + (fileInputRef.current?.files?.length || 0)}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Supported formats: JPEG, PNG, WebP (max 10MB each)
      </div>
    </div>
  );
}

function uploadIndex(prev: number) {
  return prev + 1;
}