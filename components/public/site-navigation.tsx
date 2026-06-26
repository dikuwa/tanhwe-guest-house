"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";

const links = [
  { href: "/rooms", label: "Rooms" },
  { href: "/conference", label: "Conference" },
  { href: "/contact", label: "Contact" },
];

export function SiteNavigation({
  phone = "+264 81 380 8097",
  whatsapp = "+264 81 380 8097",
}: {
  phone?: string;
  whatsapp?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav
        aria-label="Main navigation"
        className="hidden items-center gap-6 text-sm font-medium md:flex"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}
            className={cn(
              "relative rounded-sm px-1 py-1.5 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
              pathname === link.href &&
                "text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-primary"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Hamburger button — mobile only */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-lg border md:hidden"
      >
        <Menu className="size-4" />
      </button>

      {/* Mobile drawer rendered at document.body via portal */}
      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        phone={phone}
        whatsapp={whatsapp}
      />
    </>
  );
}
