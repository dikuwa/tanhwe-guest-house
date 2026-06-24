"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

type Testimonial = {
  id: string;
  guestName: string;
  guestType: string;
  guestImage: string | null;
  text: string;
};

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<number | null>(null);

  const total = testimonials.length;
  if (!total) return null;

  const itemsPerView = typeof window !== "undefined" && window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
  const maxIndex = Math.max(0, total - itemsPerView);

  const next = useCallback(() => {
    setCurrent((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrent((prev) => Math.max(prev - 1, 0));
  }, []);

  // Autoplay with pause on interaction
  useEffect(() => {
    if (isPaused || total <= itemsPerView) return;
    intervalRef.current = setInterval(next, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, next, total, itemsPerView]);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    touchStartRef.current = null;
  };

  const visible = testimonials.slice(current, current + itemsPerView);

  return (
    <section
      className="bg-[color-mix(in_oklch,var(--secondary)_8%,var(--background))]"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className="mx-auto max-w-[1180px] px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Guest Experiences</p>
          <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Why guests enjoy staying with us
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Comfortable stays, friendly assistance and convenient facilities in Mukwe.
          </p>
        </div>

        <div
          className="relative mt-12"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation arrows */}
          {current > 0 && (
            <button
              onClick={prev}
              className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-white p-2 shadow-sm transition-colors hover:bg-neutral-50 md:flex"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="size-5 text-neutral-600" />
            </button>
          )}
          {current < maxIndex && (
            <button
              onClick={next}
              className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-white p-2 shadow-sm transition-colors hover:bg-neutral-50 md:flex"
              aria-label="Next testimonials"
            >
              <ChevronRight className="size-5 text-neutral-600" />
            </button>
          )}

          {/* Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <article
                key={t.id}
                className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-sm"
              >
                <Quote className="size-8 text-primary/30" />
                <p className="mt-3 flex-1 text-sm leading-6 text-neutral-600 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {t.guestName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{t.guestName}</p>
                    <p className="text-xs text-neutral-500">{t.guestType}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Dot indicators */}
          {maxIndex > 0 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: maxIndex + 1 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`size-2 rounded-full transition-all ${
                    i === current
                      ? "w-6 bg-secondary"
                      : "bg-neutral-300 hover:bg-neutral-400"
                  }`}
                  aria-label={`Go to testimonial group ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
