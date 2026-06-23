import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { getPublicSettings } from "@/lib/public-data";
import { TanhweLogo } from "@/components/tanhwe-logo";

export async function SiteFooter() {
  const settings = await getPublicSettings();
  const phone = settings.phone.replace(/[^+\d]/g, "");
  const whatsapp = settings.whatsapp.replace(/\D/g, "");

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] md:py-16">
        <div>
          <TanhweLogo size="lg" className="text-secondary-foreground" />
          <p className="mt-3 max-w-sm text-sm leading-6 text-secondary-foreground/70">
            Comfortable accommodation and conference facilities in Mukwe, served with warm Namibian hospitality.
          </p>
        </div>
        <div className="space-y-2.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/50">Contact</p>
          <p className="flex items-start gap-2 text-secondary-foreground/70">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {settings.location}
          </p>
          <a
            className="flex items-center gap-2 text-secondary-foreground/70 transition-colors hover:text-white"
            href={`tel:${phone}`}
          >
            <Phone className="size-4" />
            {settings.phone}
          </a>
          <a
            className="flex items-center gap-2 text-secondary-foreground/70 transition-colors hover:text-white"
            href={`https://wa.me/${whatsapp}`}
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        </div>
        <div className="space-y-2.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/50">Explore</p>
          <Link className="block text-secondary-foreground/70 transition-colors hover:text-white" href="/rooms">
            Rooms
          </Link>
          <Link className="block text-secondary-foreground/70 transition-colors hover:text-white" href="/#conference">
            Conference facilities
          </Link>
          <Link className="block text-secondary-foreground/70 transition-colors hover:text-white" href="/contact">
            Contact us
          </Link>
          <Link className="block text-secondary-foreground/50 text-xs transition-colors hover:text-white" href="/admin">
            Staff login
          </Link>
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center text-xs text-secondary-foreground/50">
        &copy; {new Date().getFullYear()} Tanhwe Guest House &mdash; Mukwe, Kavango East, Namibia
      </div>
    </footer>
  );
}
