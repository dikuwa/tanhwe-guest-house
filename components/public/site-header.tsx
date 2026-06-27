import { TanhweLogo } from "@/components/tanhwe-logo";
import { buttonVariants } from "@/components/ui/button";
import { getPublicSettings } from "@/lib/public-data";
import { cn } from "@/lib/utils";
import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { SiteNavigation } from "./site-navigation";

export async function SiteHeader() {
  const settings = await getPublicSettings();
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-16">
        <TanhweLogo href="/" size="sm" />
        <SiteNavigation phone={settings.phone} whatsapp={settings.whatsapp} />
        <div className="flex items-center gap-2">
          <a
            href={phoneHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "bg-[color-mix(in_oklch,var(--secondary)_9%,var(--background))] text-secondary hover:bg-[color-mix(in_oklch,var(--secondary)_16%,var(--background))] hover:text-secondary active:bg-[color-mix(in_oklch,var(--secondary)_22%,var(--background))]"
            )}
            aria-label={`Call ${settings.phone}`}
          >
            <Phone aria-hidden="true" className="size-4" />
            <span className="ml-2 hidden sm:inline">{settings.phone}</span>
          </a>
          <Link href="/rooms#booking" className={buttonVariants({ size: "sm" })}>
            Book a stay
          </Link>
        </div>
      </div>
      <div className="border-t bg-[color-mix(in_oklch,var(--secondary)_8%,var(--background))] px-4 py-1.5 text-center text-xs text-muted-foreground md:hidden">
        <MapPin aria-hidden="true" className="mr-1 inline size-3 align-middle" />{" "}
        {settings.location}
      </div>
    </header>
  );
}
