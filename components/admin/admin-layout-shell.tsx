"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { TanhweLogo } from "@/components/tanhwe-logo";
import { AdminNav } from "./admin-nav";
import { MobileDrawer } from "./mobile-drawer";
import { NotificationBell } from "./notification-bell";
import { cn } from "@/lib/utils";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      <aside
        className={cn(
          "hidden border-r border-neutral-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:flex-col transition-all duration-200",
          sidebarCollapsed ? "lg:w-16" : "lg:w-60"
        )}
      >
        <div className={cn(
          "flex h-14 shrink-0 items-center border-b border-neutral-100",
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!sidebarCollapsed && <TanhweLogo href="/admin" size="sm" />}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="inline-flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <AdminNav role={String(role)} collapsed={sidebarCollapsed} />
        </div>
      </aside>

      <div className={cn("transition-all duration-200", sidebarCollapsed ? "lg:pl-16" : "lg:pl-60")}>
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
