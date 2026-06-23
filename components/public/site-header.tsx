import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getPublicSettings } from "@/lib/public-data";
import { SiteNavigation } from "./site-navigation";

export async function SiteHeader() {
  const settings = await getPublicSettings();
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-heading text-xl font-bold tracking-tight text-secondary">
          Tanhwe <span className="text-primary">Guest House</span>
        </Link>
        <SiteNavigation />
        <div className="flex items-center gap-2">
          <a href={phoneHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Phone aria-hidden="true" />
            <span className="hidden sm:inline">Call us</span>
          </a>
          <Link href="/rooms#booking" className={buttonVariants({ size: "sm" })}>
            Book a stay
          </Link>
        </div>
      </div>
      <div className="border-t bg-[color-mix(in_oklch,var(--secondary)_8%,var(--background))] px-4 py-1.5 text-center text-xs text-muted-foreground md:hidden">
        <MapPin aria-hidden="true" className="mr-1 inline size-3" /> {settings.location}
      </div>
    </header>
  );
}
