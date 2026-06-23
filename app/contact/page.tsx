import type { Metadata } from "next";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactActions } from "@/components/public/contact-actions";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicSettings } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Contact | Tanhwe Guest House",
  description: "Call, WhatsApp, or visit Tanhwe Guest House in Mukwe, Namibia.",
};
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getPublicSettings();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
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
                    Check-in {settings.checkInTime}, check-out {settings.checkOutTime}
                  </p>
                </div>
              </div>
            </div>
            <ContactActions phone={settings.phone} whatsapp={settings.whatsapp} className="mt-8" />
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-xs sm:p-10">
            <MapPin className="size-8 text-secondary" />
            <h2 className="mt-8 font-heading text-2xl font-bold text-neutral-800">Mukwe, Namibia</h2>
            <p className="mt-3 leading-7 text-neutral-500">
              Ask us for a location pin when confirming your booking. We&rsquo;ll share clear arrival
              directions directly by WhatsApp.
            </p>
            <a
              className="mt-6 inline-flex items-center gap-1.5 font-medium text-secondary underline decoration-secondary/30 underline-offset-4 transition-colors hover:decoration-secondary"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.location)}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Mukwe in Google Maps
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
