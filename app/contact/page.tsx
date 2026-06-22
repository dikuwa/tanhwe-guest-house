import type { Metadata } from "next";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactActions } from "@/components/public/contact-actions";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Contact | Tanhwe Guest House", description: "Call, WhatsApp, or visit Tanhwe Guest House in Mukwe, Namibia." };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getPublicSettings();
  return (
    <div className="min-h-screen"><SiteHeader /><main>
      <section className="bg-secondary px-4 py-20 text-secondary-foreground sm:px-6 lg:py-28"><div className="mx-auto max-w-[1180px]"><p className="text-sm font-semibold text-primary">We are easy to reach</p><h1 className="mt-3 max-w-3xl font-playfair text-5xl font-bold tracking-tight sm:text-7xl">Let’s plan your stay in Mukwe.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-secondary-foreground/70">For room availability, conference enquiries, or arrival details, contact us directly.</p></div></section>
      <section className="mx-auto grid max-w-[1180px] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:py-28">
        <div><h2 className="font-playfair text-4xl font-bold">Contact details</h2><div className="mt-8 space-y-7"><div className="flex gap-4"><MapPin className="mt-1 size-5 text-primary" /><div><p className="font-semibold">Location</p><p className="mt-1 text-muted-foreground">{settings.location}</p></div></div><div className="flex gap-4"><Phone className="mt-1 size-5 text-primary" /><div><p className="font-semibold">Phone</p><p className="mt-1 text-muted-foreground">{settings.phone}</p></div></div><div className="flex gap-4"><MessageCircle className="mt-1 size-5 text-primary" /><div><p className="font-semibold">WhatsApp</p><p className="mt-1 text-muted-foreground">{settings.whatsapp}</p></div></div><div className="flex gap-4"><Clock className="mt-1 size-5 text-primary" /><div><p className="font-semibold">Stay times</p><p className="mt-1 text-muted-foreground">Check-in {settings.checkInTime}, check-out {settings.checkOutTime}</p></div></div></div><ContactActions phone={settings.phone} whatsapp={settings.whatsapp} className="mt-10" /></div>
        <div className="min-h-[420px] rounded-xl bg-[color-mix(in_oklch,var(--secondary)_9%,var(--background))] p-8 sm:p-12"><MapPin className="size-10 text-secondary" /><h2 className="mt-12 font-playfair text-4xl font-bold">Mukwe, Namibia</h2><p className="mt-5 max-w-lg leading-7 text-muted-foreground">Ask us for a location pin when confirming your booking. We will share clear arrival directions directly by WhatsApp.</p><a className="mt-8 inline-flex font-semibold text-secondary underline decoration-secondary/30 underline-offset-4" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.location)}`} target="_blank" rel="noreferrer">Open Mukwe in Google Maps</a></div>
      </section>
    </main><SiteFooter /></div>
  );
}
