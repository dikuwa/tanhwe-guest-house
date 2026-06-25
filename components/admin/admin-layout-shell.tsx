"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { TanhweLogo } from "@/components/tanhwe-logo";
import { AdminNav } from "./admin-nav";
import { MobileDrawer } from "./mobile-drawer";
import { NotificationBell } from "./notification-bell";

type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
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
  const { name, role, image } = session.user;

  const userAvatar = image ? (
    <Image src={image} alt={name} width={32} height={32} className="size-8 rounded-full object-cover" />
  ) : (
    <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-600">
      {name.charAt(0).toUpperCase()}
    </div>
  );

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
          <TanhweLogo href="/admin" size="sm" />
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
            <TanhweLogo size="sm" showIcon={false} />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {userAvatar}
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden h-14 items-center justify-end border-b border-neutral-100 bg-white px-6 lg:flex">
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-800">{name}</p>
              <p className="text-xs capitalize text-neutral-500">{String(role)}</p>
            </div>
            {userAvatar}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
