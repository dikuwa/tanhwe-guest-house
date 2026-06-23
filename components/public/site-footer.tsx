import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { getPublicSettings } from "@/lib/public-data";

export async function SiteFooter() {
  const settings = await getPublicSettings();
  const phone = settings.phone.replace(/[^+\d]/g, "");
  const whatsapp = settings.whatsapp.replace(/\D/g, "");

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-heading text-3xl font-bold">Tanhwe Guest House</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-secondary-foreground/75">
            Comfortable accommodation and practical conference facilities in Mukwe, served with warm
            Namibian hospitality.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Visit and contact</p>
          <p className="flex gap-2 text-secondary-foreground/75">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {settings.location}
          </p>
          <a
            className="flex gap-2 text-secondary-foreground/75 hover:text-white"
            href={`tel:${phone}`}
          >
            <Phone className="size-4" />
            {settings.phone}
          </a>
          <a
            className="flex gap-2 text-secondary-foreground/75 hover:text-white"
            href={`https://wa.me/${whatsapp}`}
          >
            <MessageCircle className="size-4" />
            WhatsApp us
          </a>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Explore</p>
          <Link className="block text-secondary-foreground/75 hover:text-white" href="/rooms">
            Rooms
          </Link>
          <Link className="block text-secondary-foreground/75 hover:text-white" href="/#conference">
            Conference facilities
          </Link>
          <Link className="block text-secondary-foreground/75 hover:text-white" href="/contact">
            Contact
          </Link>
          <Link className="block text-secondary-foreground/50 hover:text-white" href="/admin">
            Staff login
          </Link>
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-5 text-center text-xs text-secondary-foreground/60">
        © {new Date().getFullYear()} Tanhwe Guest House. Mukwe, Namibia.
      </div>
    </footer>
  );
}
