"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const { name, role, image } = session.user;

  const userAvatar = image ? (
    <Image src={image} alt={name} width={32} height={32} className="size-8 rounded-full object-cover" />
  ) : (
    <div className="flex size-8 items-center justify-center rounded-full bg-primary-50 text-sm font-medium text-primary-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileDrawer
        role={String(role)}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          hamburgerRef.current?.focus();
        }}
      />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r border-sidebar-border bg-sidebar md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:flex-col transition-all duration-200",
          sidebarCollapsed ? "md:w-16" : "md:w-60"
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
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-muted hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <AdminNav role={String(role)} collapsed={sidebarCollapsed} />
        </div>
      </aside>

      <div className={cn("transition-all duration-200", sidebarCollapsed ? "md:pl-16" : "md:pl-60")}>
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-neutral-100 bg-card px-4 md:hidden">
          <div className="flex items-center gap-3">
            <button
              ref={hamburgerRef}
              type="button"
              aria-label={drawerOpen ? "Close dashboard navigation" : "Open dashboard navigation"}
              aria-expanded={drawerOpen}
              aria-controls="admin-nav-drawer"
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border text-neutral-600 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
              onClick={() => setDrawerOpen((v) => !v)}
            >
              {drawerOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            </button>
            <TanhweLogo href="/admin" size="sm" className="max-w-[170px]" />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {userAvatar}
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden h-14 items-center justify-end border-b border-neutral-100 bg-card px-6 md:flex">
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{name}</p>
              <p className="text-xs capitalize text-neutral-500">{String(role)}</p>
            </div>
            {userAvatar}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
