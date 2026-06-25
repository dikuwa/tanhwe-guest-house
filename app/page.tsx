import Link from "next/link";
import { ArrowRight, Coffee, MapPin, Presentation, ShieldCheck, Trees } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AvailabilitySearch } from "@/components/public/availability-search";
import { ContactActions } from "@/components/public/contact-actions";
import { RoomCard } from "@/components/public/room-card";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { FaqSection } from "@/components/public/faq-section";
import { TestimonialCarousel } from "@/components/public/testimonial-carousel";
import { getPublicFaqs, getPublicRooms, getPublicSettings, getPublicTestimonials } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [rooms, settings, faqItems, testimonialItems] = await Promise.all([
    getPublicRooms(),
    getPublicSettings(),
    getPublicFaqs(),
    getPublicTestimonials(),
  ]);
  const featured = rooms.filter((room) => room.featured).slice(0, 3);
  const shownRooms = featured.length ? featured : rooms.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-neutral-900 md:min-h-[calc(100svh-4rem)]">
          {/* Responsive background image */}
          <picture>
            <source media="(max-width: 767px)" srcSet="/images/hero-mobile.webp" />
            <source media="(min-width: 768px)" srcSet="/images/hero-desktop.webp" />
            <img
              alt=""
              fetchPriority="high"
              className="absolute inset-0 size-full object-cover object-[55%_center] max-md:object-[center_15%]"
              src="/images/hero-desktop.webp"
            />
          </picture>

          {/* Desktop dark overlay */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/82 from-0% via-black/68 via-30% via-black/30 via-60% to-black/18 to-100% md:block" />

          {/* Mobile dark overlay */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/28 from-0% via-black/34 via-28% via-black/70 via-58% to-black/92 to-100% md:hidden" />

          {/* Hero content */}
          <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 items-center px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
            <div className="max-w-xl lg:pl-8">
              <Badge
                variant="outline"
                className="border-neutral-300 bg-white/80 text-neutral-600"
              >
                <MapPin className="size-3.5" /> Mukwe, Namibia
              </Badge>
              <h1 className="mt-6 font-heading text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Stay easy.
                <br />
                <span className="text-primary">Feel at home.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/70">
                Comfortable rooms, breakfast included, and a welcome that keeps things simple.
              </p>
              <ContactActions
                phone={settings.phone}
                whatsapp={settings.whatsapp}
                className="mt-8"
              />
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-auto -mt-1 max-w-[1180px] px-4 sm:px-6 lg:-mt-8">
          <div className="rounded-xl border bg-card p-5 shadow-[0_18px_55px_-42px_rgba(17,24,39,.45)] sm:p-6">
            <AvailabilitySearch rooms={rooms.map(({ slug, name }) => ({ slug, name }))} />
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-24 sm:px-6 lg:py-32">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-secondary">Rooms for real rest</p>
              <h2 className="mt-2 max-w-2xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Simple comforts, thoughtfully prepared.
              </h2>
            </div>
            <Link href="/rooms" className={buttonVariants({ variant: "outline" })}>
              View all rooms <ArrowRight />
            </Link>
          </div>
          {shownRooms.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shownRooms.map((room) => (
                <RoomCard key={room.id} room={room} currency={settings.currency} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-xl bg-muted p-8 text-muted-foreground">
              Room information is being prepared. Please call or WhatsApp us for availability.
            </div>
          )}
        </section>

        <section className="bg-[color-mix(in_oklch,var(--primary)_10%,var(--background))]">
          <div className="mx-auto grid max-w-[1180px] gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-32">
            <div>
              <p className="font-heading text-4xl font-bold sm:text-5xl">
                Good mornings start here.
              </p>
              <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
                Breakfast is included with every advertised room, so your first decision of the day
                can wait.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <Coffee className="size-7 text-primary" />
                <p className="mt-4 font-semibold">Breakfast included</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A practical start to every stay.
                </p>
              </div>
              <div>
                <Trees className="size-7 text-primary" />
                <p className="mt-4 font-semibold">A calm setting</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Space to settle in and slow down.
                </p>
              </div>
              <div>
                <ShieldCheck className="size-7 text-primary" />
                <p className="mt-4 font-semibold">Clear enquiries</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Request first, then confirm directly with us.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1180px] gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-32">
          <div className="min-h-[360px] rounded-xl bg-secondary p-8 text-secondary-foreground sm:p-12">
            <Presentation className="size-10 text-primary" />
            <h2 className="mt-10 max-w-xl font-heading text-4xl font-bold sm:text-5xl">
              Meet, plan, and gather in Mukwe.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-secondary-foreground/75">
              Our conference facilities support business meetings, workshops, and community
              gatherings. Tell us what you need and we will prepare a suitable quote.
            </p>
          </div>
          <div className="flex flex-col justify-center lg:pl-8">
            <p className="text-sm font-semibold text-primary">Conference enquiries</p>
            <h3 className="mt-3 font-heading text-3xl font-bold">
              A straightforward space for getting things done.
            </h3>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              <li>Flexible setup by enquiry</li>
              <li>Accommodation available for visiting teams</li>
              <li>Breakfast and hospitality support</li>
            </ul>
            <ContactActions
              phone={settings.phone}
              whatsapp={settings.whatsapp}
              message="Hello Tanhwe Guest House, I would like to enquire about your conference facilities."
              className="mt-8"
            />
            <Link href="/conference" className={buttonVariants({ variant: "link", className: "mt-3 self-start" })}>
              View conference details <ArrowRight />
            </Link>
          </div>
        </section>

        <TestimonialCarousel testimonials={testimonialItems} />

        <FaqSection faqs={faqItems} />
      </main>
      <SiteFooter />
    </div>
  );
}
