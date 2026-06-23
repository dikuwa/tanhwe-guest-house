"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminNav } from "./admin-nav";
import { MobileDrawer } from "./mobile-drawer";

type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export function AdminLayoutShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { name, role } = session.user;

  return (
    <div className="min-h-screen bg-neutral-50">
      <MobileDrawer
        role={String(role)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Desktop sidebar */}
      <aside className="hidden border-r border-neutral-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-60 lg:flex-col">
        <div className="flex h-14 items-center justify-between border-b border-neutral-100 px-4">
          <Link href="/admin" className="font-heading text-base font-bold tracking-tight">
            <span className="text-secondary">Tanhwe</span>{" "}
            <span className="text-primary">Admin</span>
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <AdminNav role={String(role)} />
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-neutral-100 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open admin menu"
              className="inline-flex size-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="size-4" />
            </button>
            <span className="font-heading text-sm font-bold">
              <span className="text-secondary">Tanhwe</span>{" "}
              <span className="text-primary">Admin</span>
            </span>
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-600">
            {name.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden h-14 items-center justify-end border-b border-neutral-100 bg-white px-6 lg:flex">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-800">{name}</p>
              <p className="text-xs capitalize text-neutral-500">{String(role)}</p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-600">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
