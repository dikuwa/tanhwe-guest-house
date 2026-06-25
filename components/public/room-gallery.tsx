"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/ui/lightbox";
import { roomFallbackImage } from "@/lib/images";

type RoomGalleryImage = {
  url: string;
  alt: string;
};

type RoomGalleryProps = {
  images: RoomGalleryImage[];
  roomName: string;
  heroImageUrl: string | null;
};

export function RoomGallery({ images, roomName, heroImageUrl }: RoomGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const validImages = useMemo(
    () =>
      images.filter(
        (img, idx, self) => img.url && idx === self.findIndex((i) => i.url === img.url)
      ),
    [images]
  );

  const totalImages = validImages.length;
  const hasLightbox = totalImages > 0;

  const heroSrc = heroImageUrl ?? validImages[0]?.url ?? roomFallbackImage.url;
  const heroAlt = heroImageUrl
    ? (validImages.find((i) => i.url === heroImageUrl)?.alt ??
      `${roomName} at Tanhwe Guest House`)
    : validImages[0]?.alt ?? roomFallbackImage.alt;

  const heroIndex = heroImageUrl
    ? Math.max(validImages.findIndex((img) => img.url === heroImageUrl), 0)
    : 0;

  const previewThumbnails = useMemo(() => {
    const usedUrls = new Set<string>();
    usedUrls.add(heroImageUrl ?? validImages[0]?.url ?? "");
    return validImages
      .filter((img) => {
        if (usedUrls.has(img.url)) return false;
        usedUrls.add(img.url);
        return true;
      })
      .slice(0, 2);
  }, [validImages, heroImageUrl]);

  const hiddenCount = totalImages - 1 - previewThumbnails.length;

  const openLightbox = useCallback(
    (index: number) => {
      setLightboxIndex(index);
      setLightboxOpen(true);
    },
    []
  );

  const handleClose = useCallback(() => setLightboxOpen(false), []);
  const handleNavigate = useCallback((index: number) => setLightboxIndex(index), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(index);
      }
    },
    [openLightbox]
  );

  return (
    <>
      <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
        <div
          className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted lg:aspect-auto lg:min-h-[500px]"
          onClick={() => hasLightbox && openLightbox(heroIndex)}
          onKeyDown={(e) => hasLightbox && handleKeyDown(e, heroIndex)}
          role={hasLightbox ? "button" : undefined}
          tabIndex={hasLightbox ? 0 : undefined}
          aria-label={hasLightbox ? `Open gallery — ${heroAlt}` : heroAlt}
        >
          <Image
            src={heroSrc}
            alt={heroAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 70vw"
            className={hasLightbox ? "object-cover cursor-pointer" : "object-cover"}
            style={
              !heroImageUrl && !validImages[0]
                ? { objectPosition: "50% 16%" }
                : undefined
            }
          />
        </div>
        {previewThumbnails.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {previewThumbnails.map((image, i) => {
              const globalIndex = Math.max(
                validImages.findIndex((img) => img.url === image.url),
                0
              );
              const isLastWithOverlay =
                i === previewThumbnails.length - 1 && hiddenCount > 0;
              return (
                <div
                  key={image.url}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
                  onClick={() => openLightbox(globalIndex)}
                  onKeyDown={(e) => handleKeyDown(e, globalIndex)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open gallery — ${image.alt}`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 30vw"
                    className="object-cover cursor-pointer"
                  />
                  {isLastWithOverlay && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-lg font-semibold text-white">
                        +{hiddenCount} more
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {lightboxOpen && hasLightbox && (
        <Lightbox
          images={validImages}
          currentIndex={lightboxIndex}
          onClose={handleClose}
          onNavigate={handleNavigate}
          roomName={roomName}
        />
      )}
    </>
  );
}
