"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/ui/lightbox";

interface ConferenceImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export function ConferenceGallery() {
  const [images, setImages] = useState<ConferenceImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/conference/images")
      .then((res) => res.json())
      .then((data) => {
        if (data.images) setImages(data.images);
      })
      .catch(() => {
        // Silently fall back — no images shown
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || images.length === 0) return null;

  const visible = images.slice(0, 3);

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
        {/* Lead image */}
        <button
          onClick={() => setLightboxIndex(0)}
          className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted text-left lg:aspect-auto lg:min-h-[400px] focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <Image
            src={visible[0].imageUrl}
            alt={visible[0].altText ?? "Tanhwe Guest House conference facility"}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 70vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </button>

        {/* Supporting images */}
        {visible.length > 1 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {visible.slice(1).map((image, i) => (
              <button
                key={image.id}
                onClick={() => setLightboxIndex(i + 1)}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <Image
                  src={image.imageUrl}
                  alt={image.altText ?? `Conference image ${i + 2}`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images.map((img) => ({
            url: img.imageUrl,
            alt: img.altText ?? "Conference facility",
          }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
