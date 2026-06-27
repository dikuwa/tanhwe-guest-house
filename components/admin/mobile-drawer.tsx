"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { PanelLeftClose, LogOut, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TanhweLogo } from "@/components/tanhwe-logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { items } from "./admin-nav";

function flattenItems(items: typeof import("./admin-nav").items) {
  const flat: { href: string; label: string; icon: LucideIcon; roles: string[] }[] = [];
  for (const item of items) {
    if ("children" in item && item.children) {
      flat.push({
        href: item.children[0]?.href ?? "",
        label: item.label,
        icon: item.icon,
        roles: item.roles,
      });
      for (const child of item.children) {
        flat.push({ href: child.href, label: child.label, icon: item.icon, roles: item.roles });
      }
    } else if ("href" in item) {
      flat.push(item);
    }
  }
  return flat;
}

const allFlat = flattenItems(items);
const primaryItems = allFlat.filter((i) => i.href !== "/admin/settings");
const secondaryItems = allFlat.filter((i) => i.href === "/admin/settings");

export function MobileDrawer({
  role,
  open,
  onClose,
}: {
  role: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const reduced = useReducedMotion();

  const filteredPrimary = primaryItems
    .filter((i) => i.roles.includes(role))
    .filter((i) => !searchQuery || i.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredSecondary = secondaryItems
    .filter((i) => i.roles.includes(role))
    .filter((i) => !searchQuery || i.label.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    if (open) onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const isActive = useCallback(
    (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href)),
    [pathname]
  );

  const anim = {
    duration: reduced ? 0 : 0.2,
    ...(reduced ? {} : { ease: "easeOut" as const }),
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-black/[0.42] md:hidden"
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={anim}
            className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-border bg-card shadow-lg md:hidden"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-100 px-4">
              <TanhweLogo href="/admin" size="sm" className="max-w-[170px]" />
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close dashboard navigation"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
                onClick={onClose}
              >
                <PanelLeftClose className="size-5" />
              </button>
            </div>

            <div className="shrink-0 px-4 pt-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-neutral-700 placeholder:text-neutral-400 transition-colors hover:border-neutral-300 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
                  aria-label="Search navigation items"
                />
              </div>
            </div>

            <nav
              id="admin-nav-drawer"
              className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
              aria-label="Admin navigation"
            >
              <div className="space-y-0.5">
                {filteredPrimary.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-50 text-primary-700 hover:bg-primary-100"
                          : "text-neutral-600 hover:bg-muted hover:text-neutral-900"
                      )}
                    >
                      <item.icon className="size-5 shrink-0" />
                      <span className="min-w-0">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="shrink-0 border-t border-neutral-100 px-3 py-2">
              {filteredSecondary.length > 0 && (
                <div className="space-y-0.5">
                  {filteredSecondary.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary-50 text-primary-700 hover:bg-primary-100"
                            : "text-neutral-600 hover:bg-muted hover:text-neutral-900"
                        )}
                      >
                        <item.icon className="size-5 shrink-0" />
                        <span className="min-w-0">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await authClient.signOut();
                  router.replace("/login");
                  router.refresh();
                }}
                className="flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-xl px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-muted hover:text-neutral-900"
              >
                <LogOut className="size-5 shrink-0" />
                <span className="min-w-0">Sign out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
