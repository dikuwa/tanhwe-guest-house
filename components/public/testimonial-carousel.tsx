"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

type Testimonial = {
  id: string;
  guestName: string;
  guestType: string;
  guestImage: string | null;
  text: string;
};

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [transition, setTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const slideIndexRef = useRef<number>(slideIndex);

  useEffect(() => { slideIndexRef.current = slideIndex; }, [slideIndex]);

  const total = testimonials.length;
  const slides = useMemo(
    () => !total ? [] : [...testimonials, ...testimonials, ...testimonials],
    [testimonials, total]
  );

  useEffect(() => {
    if (!total) return;
    function update() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      let perView = 1;
      if (w >= 1024) perView = 3;
      else if (w >= 768) perView = 2;
      setItemsPerView(perView);
      setCardWidth(w / perView);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [total]);

  useEffect(() => {
    if (!total) return;
    const target = total;
    const timer = window.setTimeout(() => {
      setSlideIndex(target);
      setTransition(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [total]);

  const goToSlide = useCallback(
    (realIndex: number) => {
      setTransition(true);
      setSlideIndex(total + realIndex);
    },
    [total]
  );

  const next = useCallback(() => {
    if (!total) return;
    const idx = slideIndexRef.current;
    const nextIdx = idx + itemsPerView;

    if (nextIdx >= total * 2) {
      setTransition(false);
      setSlideIndex(total - itemsPerView + (nextIdx - total * 2));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setTransition(true);
          setSlideIndex(total);
        })
      );
    } else {
      setSlideIndex(nextIdx);
    }
  }, [total, itemsPerView]);

  const prev = useCallback(() => {
    if (!total) return;
    const idx = slideIndexRef.current;
    const prevIdx = idx - itemsPerView;

    if (prevIdx < 0) {
      setTransition(false);
      setSlideIndex(total * 2 + prevIdx + itemsPerView);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setTransition(true);
          setSlideIndex(total * 2 + prevIdx);
        })
      );
    } else {
      setSlideIndex(prevIdx);
    }
  }, [total, itemsPerView]);

  useEffect(() => {
    if (!total || isPaused || total <= itemsPerView) return;
    intervalRef.current = setInterval(next, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused, next, total, itemsPerView]);

  if (!total) return null;

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  // ── Touch / swipe ──

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

  // ── Current real index (for dot indicators) ──

  const realIndex = ((slideIndex - total) % total + total) % total;
  const dotCount = Math.max(1, Math.ceil(total / itemsPerView));
  const currentDot = Math.min(Math.floor(realIndex / itemsPerView), dotCount - 1);

  // ── Offset in pixels ──

  const offset = -(slideIndex * cardWidth);

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
          {/* Navigation arrows (always visible — infinite loop) */}
          <button
            onClick={prev}
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-white p-2 shadow-sm transition-colors hover:bg-neutral-50 md:flex"
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="size-5 text-neutral-600" />
          </button>
          <button
            onClick={next}
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-white p-2 shadow-sm transition-colors hover:bg-neutral-50 md:flex"
            aria-label="Next testimonials"
          >
            <ChevronRight className="size-5 text-neutral-600" />
          </button>

          {/* Track */}
          <div ref={containerRef} className="overflow-hidden">
            <div
              ref={trackRef}
              className="flex"
              style={{
                transform: `translate3d(${offset}px, 0, 0)`,
                transition: transition ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
              }}
            >
              {slides.map((t, i) => (
                <article
                  key={`${t.id}-${i}`}
                  className="flex flex-shrink-0 px-3"
                  style={{ width: cardWidth ? `${cardWidth}px` : `${100 / itemsPerView}%` }}
                >
                  <div className="flex flex-1 flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-sm">
                    <Quote className="size-8 text-primary/30" />
                    <p className="mt-3 flex-1 text-sm leading-6 text-neutral-600 italic">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
                      {t.guestImage ? (
                        <img
                          src={t.guestImage}
                          alt={t.guestName}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {t.guestName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{t.guestName}</p>
                        <p className="text-xs text-neutral-500">{t.guestType}</p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          {dotCount > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: dotCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i * itemsPerView)}
                  className={`size-2 rounded-full transition-all ${
                    i === currentDot
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
