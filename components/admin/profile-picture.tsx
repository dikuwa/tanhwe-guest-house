"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfilePictureProps {
  currentImage: string | null;
  userName: string;
  userId: string;
}

export function ProfilePicture({ currentImage, userName, userId }: ProfilePictureProps) {
  const [image, setImage] = useState<string | null>(currentImage);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", "profiles");

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }

      const { imageUrl } = await res.json();

      // Save the URL to the user's profile
      const saveRes = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!saveRes.ok) throw new Error("Failed to save profile picture");
      setImage(imageUrl);
      setMessage("Profile picture updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove your profile picture?")) return;
    setMessage("");

    try {
      const saveRes = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "" }),
      });

      if (!saveRes.ok) throw new Error("Failed to remove profile picture");
      setImage(null);
      setMessage("Profile picture removed");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
        {image ? (
          <Image src={image} alt={userName} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl font-bold text-neutral-400">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            {uploading ? "Uploading..." : image ? "Change" : "Upload picture"}
          </Button>
          {image && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-neutral-400">JPEG, PNG, or WebP. Max 5 MB.</p>
        {message && <p className="text-xs text-green-600">{message}</p>}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
