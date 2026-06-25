"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LightboxImage = {
  url: string;
  alt: string;
};

type LightboxProps = {
  images: LightboxImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  roomName?: string;
};

export function Lightbox({ images, currentIndex, onClose, onNavigate, roomName }: LightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [currentIndex]);

  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
  }, []);

  const prev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const next = useCallback(() => {
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); return; }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  useEffect(() => {
    return () => {
      prevFocusRef.current?.focus();
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.touches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!images.length) return null;

  const current = images[currentIndex];

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={roomName ? `Gallery — ${roomName}` : "Image gallery"}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Close image gallery"
      >
        <X className="size-5" />
      </button>

      <div className="absolute left-4 top-4 z-10 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
        {currentIndex + 1} of {images.length}
      </div>

      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-2 z-10 flex size-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-4"
          aria-label="Previous image"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-2 z-10 flex size-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-4"
          aria-label="Next image"
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      <div
        className="relative mx-12 flex h-full w-full max-w-5xl items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {imageLoading && !imageError && (
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:hidden" />
            <div className="size-8 hidden motion-reduce:block rounded-full bg-white/20 motion-reduce:animate-pulse" />
          </div>
        )}
        {imageError ? (
          <div className="flex flex-col items-center gap-2 text-white/60">
            <ImageIcon className="size-12" />
            <p className="text-sm">This image could not be loaded.</p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.alt}
            className={cn(
              "max-h-full max-w-full object-contain transition-opacity duration-300",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setImageLoading(false)}
            onError={() => { setImageLoading(false); setImageError(true); }}
          />
        )}
      </div>

      {roomName && current.alt && (
        <p className="absolute bottom-16 left-1/2 -translate-x-1/2 text-sm text-white/70 max-w-[80vw] truncate text-center">
          {current.alt}
        </p>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className={cn(
                "size-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                i === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
