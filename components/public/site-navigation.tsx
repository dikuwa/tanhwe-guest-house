"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/rooms", label: "Rooms" },
  { href: "/#conference", label: "Conference" },
  { href: "/contact", label: "Contact" },
];

export function SiteNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
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
              pathname === link.href && "text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-primary"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-lg border md:hidden"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}
      {open && (
        <nav
          ref={menuRef}
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="fixed inset-x-0 top-14 z-50 border-b bg-background p-4 shadow-lg animate-fade-in md:hidden"
        >
          <div className="mx-auto flex max-w-[1180px] flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted",
                  pathname === link.href && "bg-muted text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
