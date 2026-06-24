import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, MessageCircle, Users, Presentation, Lightbulb, PenLine, Building2, UsersRound, Calendar, Clock, Newspaper, Wifi } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ContactActions } from "@/components/public/contact-actions";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ConferenceGallery } from "./conference-gallery";
import { getPublicSettings } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Conference Facility | Tanhwe Guest House",
  description: "Host meetings, training sessions and small events at Tanhwe Guest House in Mukwe, Namibia.",
};
export const dynamic = "force-dynamic";

const suitableFor = [
  { icon: Presentation, label: "Meetings" },
  { icon: Lightbulb, label: "Workshops" },
  { icon: PenLine, label: "Training sessions" },
  { icon: Newspaper, label: "Presentations" },
  { icon: Building2, label: "Small conferences" },
  { icon: UsersRound, label: "Community gatherings" },
];

const amenities = [
  "Tables and chairs",
  "Power access",
  "Presentation area",
  "Wi-Fi",
  "On-site accommodation",
  "Parking",
  "Refreshment arrangement on request",
];

export default async function ConferencePage() {
  const settings = await getPublicSettings();
  const whatsapp = settings.whatsapp.replace(/\D/g, "");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* Compact hero */}
        <section className="border-b bg-[color-mix(in_oklch,var(--secondary)_8%,var(--background))] px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-[1180px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Conference Facility</p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              A practical space for meetings and small events
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Host meetings, training sessions, workshops and small gatherings in a comfortable setting in Mukwe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello Tanhwe Guest House. I would like to enquire about the conference facility. Please send me availability and pricing information.")}`}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "secondary" })}
              >
                <MessageCircle className="size-4" /> Enquire about availability
              </a>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline" })}
              >
                <MessageCircle className="size-4" /> WhatsApp us
              </a>
            </div>
          </div>
        </section>

        {/* Conference image gallery with lightbox */}
        <section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:py-16">
          <ConferenceGallery />
        </section>

        {/* Facility overview */}
        <section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Facility overview</p>
              <h2 className="mt-3 font-heading text-3xl font-bold">Everything you need for a productive session.</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Our conference facility is designed for practical, comfortable meetings. Whether you are planning a
                workshop, training session, or small conference, the space can be arranged to suit your needs.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Recommended capacity</p>
                  <p className="mt-1 text-lg font-semibold">Up to 20 guests</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Availability</p>
                  <p className="mt-1 text-lg font-semibold">By arrangement</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Operating hours</p>
                  <p className="mt-1 text-lg font-semibold">Flexible scheduling</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Pricing</p>
                  <p className="mt-1 text-lg font-semibold">Contact us for a quotation</p>
                </div>
              </div>
            </div>

            {/* Suitable for */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Suitable for</p>
              <h2 className="mt-3 font-heading text-3xl font-bold">Flexible spaces for different needs.</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {suitableFor.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                    <item.icon className="size-5 shrink-0 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section className="bg-[color-mix(in_oklch,var(--secondary)_5%,var(--background))]">
          <div className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Included amenities</p>
              <h2 className="mt-3 font-heading text-3xl font-bold">What&rsquo;s available with the space.</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-xs">
                  <Check className="size-5 shrink-0 text-primary" />
                  <span className="text-sm">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-24">
          <div className="rounded-xl border bg-card p-8 shadow-xs sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                Planning a meeting or event in Mukwe?
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Contact us for availability, pricing, and setup options tailored to your event.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello Tanhwe Guest House. I would like to enquire about the conference facility. My preferred date is flexible, and the estimated number of guests is approximately 10. Please send me availability and pricing information.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  <MessageCircle className="size-4" /> Request a quotation
                </a>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  <MessageCircle className="size-4" /> Enquire on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
