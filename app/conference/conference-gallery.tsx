"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/ui/lightbox";

const conferenceImages = [
  { url: "/images/tanhwe-room-img01.webp", alt: "Tanhwe Guest House conference facility" },
  { url: "/images/tanhwe-room-img02.webp", alt: "Conference room setup with tables and chairs" },
  { url: "/images/tanhwe-room-img03.webp", alt: "Meeting space at Tanhwe Guest House" },
];

export function ConferenceGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (conferenceImages.length === 0) return null;

  const visible = conferenceImages.slice(0, 3);

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
        {/* Lead image */}
        <button
          onClick={() => setLightboxIndex(0)}
          className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted text-left lg:aspect-auto lg:min-h-[400px] focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <Image
            src={visible[0].url}
            alt={visible[0].alt}
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
                key={image.url}
                onClick={() => setLightboxIndex(i + 1)}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
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
          images={conferenceImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
