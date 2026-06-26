"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { TanhweLogo } from "@/components/tanhwe-logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/rooms#booking", label: "Book Now" },
  { href: "/conference", label: "Conference" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({
  open,
  onClose,
  phone,
  whatsapp,
}: {
  open: boolean;
  onClose: () => void;
  phone: string;
  whatsapp: string;
}) {
  const pathname = usePathname();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Use a stable portal container at the end of <body>
    let el = document.getElementById("tanhwe-mobile-portal");
    if (!el) {
      el = document.createElement("div");
      el.id = "tanhwe-mobile-portal";
      document.body.appendChild(el);
    }
    setPortalRoot(el);
    return () => {
      const existing = document.getElementById("tanhwe-mobile-portal");
      if (existing && existing.children.length === 0) {
        existing.remove();
      }
    };
  }, []);

  // Close on route change
  useEffect(() => {
    if (open) onCloseRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll when open — save/restore original overflow
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  const whatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  if (!mounted || !portalRoot) return null;

  return createPortal(
    <div
      data-tanhwe-mobile-nav-overlay
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        minHeight: "100dvh",
        maxHeight: "none",
        overflow: "hidden",
        zIndex: 9999,
        pointerEvents: "auto",
        visibility: open ? "visible" : "hidden",
      }}
      className="md:hidden"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        data-tanhwe-mobile-nav-backdrop
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.5)",
          border: "none",
          cursor: "default",
          opacity: open ? 1 : 0,
          transition: "opacity 200ms ease",
          padding: 0,
        }}
        onClick={() => onCloseRef.current()}
      />

      {/* Drawer panel */}
      <aside
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        data-tanhwe-mobile-nav-drawer
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(88vw, 380px)",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--background, #ffffff)",
          borderLeft: "1px solid var(--border, #e5e7eb)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header row — shrink-0 */}
        <div
          data-tanhwe-mobile-nav-header
          style={{
            flexShrink: 0,
            display: "flex",
            height: "3.5rem",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border, #e5e7eb)",
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "env(safe-area-inset-top, 0px)",
          }}
        >
          <TanhweLogo size="sm" showIcon={false} />
          <button
            type="button"
            aria-label="Close navigation"
            style={{
              display: "inline-flex",
              width: "2rem",
              height: "2rem",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.375rem",
              color: "#737373",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => onCloseRef.current()}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation area — fills remaining space, scrolls if needed */}
        <nav
          aria-label="Mobile navigation"
          data-tanhwe-mobile-nav-scroll
          style={{
            flex: "1 1 0%",
            minHeight: 0,
            overflowY: "auto",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onCloseRef.current()}
                aria-current={pathname === link.href ? "page" : undefined}
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

        {/* CTA section — pushed to bottom via margin-top: auto */}
        <div
          data-tanhwe-mobile-nav-cta
          style={{
            flexShrink: 0,
            marginTop: "auto",
            borderTop: "1px solid var(--border, #e5e7eb)",
            padding: "1rem",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <a
            href={phoneHref}
            className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Phone className="size-4" />
            {phone}
          </a>
        </div>
      </aside>
    </div>,
    portalRoot
  );
}
