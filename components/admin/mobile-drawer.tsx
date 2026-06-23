"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminNav } from "./admin-nav";

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
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close when route changes
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll when open
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

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && open) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation menu"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-neutral-200 bg-white shadow-lg lg:hidden"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-100 px-4">
              <span className="font-heading text-base font-bold tracking-tight">
                <span className="text-secondary">Tanhwe</span>{" "}
                <span className="text-primary">Admin</span>
              </span>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
                onClick={onClose}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminNav role={role} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
