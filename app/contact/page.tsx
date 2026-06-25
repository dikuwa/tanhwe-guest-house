import type { Metadata } from "next";
import { Clock, HelpCircle, Info, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactActions } from "@/components/public/contact-actions";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getPublicSettings } from "@/lib/public-data";
import { formatTime } from "@/lib/time-format";

export const metadata: Metadata = {
  title: "Contact | Tanhwe Guest House",
  description: "Call, WhatsApp, or visit Tanhwe Guest House in Mukwe, Namibia.",
};
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const whatsappDigits = settings.whatsapp.replace(/\D/g, "");
  const phoneDigits = settings.phone.replace(/[^+\d]/g, "");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-secondary px-4 py-16 text-secondary-foreground sm:px-6 lg:py-24">
          <div className="mx-auto max-w-[1180px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Get in touch</p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Let&rsquo;s plan your stay in Mukwe.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-secondary-foreground/70">
              For room availability, conference enquiries, or arrival details, contact us directly.
            </p>
          </div>
        </section>

        {/* Contact details + Location card */}
        <section className="mx-auto grid max-w-[1180px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:py-24">
          <div>
            <h2 className="font-heading text-2xl font-bold text-neutral-800">Contact details</h2>
            <div className="mt-6 space-y-6">
              <div className="flex gap-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-neutral-800">Location</p>
                  <p className="mt-0.5 text-neutral-500">{settings.location}</p>
                </div>
              </div>
              {settings.email && (
                <div className="flex gap-4">
                  <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-neutral-800">Email</p>
                    <p className="mt-0.5 text-neutral-500">{settings.email}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-neutral-800">Phone</p>
                  <p className="mt-0.5 text-neutral-500">{settings.phone}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-neutral-800">WhatsApp</p>
                  <p className="mt-0.5 text-neutral-500">{settings.whatsapp}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-neutral-800">Stay times</p>
                  <p className="mt-0.5 text-neutral-500">
                    Check-in from {formatTime(settings.checkInTime)}, check-out by {formatTime(settings.checkOutTime)}
                  </p>
                </div>
              </div>
            </div>
            <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} className="mt-8" />
          </div>

          {/* Location card */}
          <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-xs sm:p-10">
            <MapPin className="size-8 text-secondary" />
            <h2 className="mt-8 font-heading text-2xl font-bold text-neutral-800">Find us in Mukwe</h2>
            <p className="mt-3 leading-7 text-neutral-500">
              Tanhwe Guest House is located in Mukwe, Kavango East, Namibia. Use the options below to get directions or request our exact location.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {/* Open location link (if configured) */}
              <a
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.location)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="size-4" /> Open location in maps
              </a>

              {/* Request location pin on WhatsApp */}
              <a
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                  "Hello Tanhwe Guest House — LOCATION REQUEST. I am planning to visit and would appreciate your exact map pin and directions to the guest house. Thank you."
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-4" /> Request location pin on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Before you arrive */}
        <section className="bg-[color-mix(in_oklch,var(--secondary)_5%,var(--background))]">
          <div className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-6 shadow-xs sm:p-8">
                <Info className="size-6 text-primary" />
                <h2 className="mt-4 font-heading text-xl font-bold text-neutral-800">Before you arrive</h2>
                <p className="mt-2 leading-7 text-neutral-600">
                  Contact us before travelling so we can confirm your booking, expected arrival time and the most
                  suitable directions to the guest house.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-xs sm:p-8">
                <HelpCircle className="size-6 text-primary" />
                <h2 className="mt-4 font-heading text-xl font-bold text-neutral-800">Need help with your booking?</h2>
                <p className="mt-2 leading-7 text-neutral-600">
                  Our team can assist with room availability, conference enquiries, booking confirmation and arrival
                  arrangements by phone or WhatsApp.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`tel:${phoneDigits}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Phone className="size-4" /> Call us
                  </a>
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    <MessageCircle className="size-4" /> WhatsApp us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
