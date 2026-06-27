"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BedDouble,
  BellRing,
  BookOpen,
  ChevronDown,
  ExternalLink,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["owner", "admin", "staff"] },
  {
    label: "Rooms",
    icon: BedDouble,
    roles: ["owner", "admin"],
    children: [
      { href: "/admin/rooms", label: "All rooms" },
      { href: "/admin/rooms/manage", label: "Inventory" },
    ],
  },
  { href: "/admin/bookings", label: "Bookings", icon: BookOpen, roles: ["owner", "admin", "staff"] },
  { href: "/admin/customers", label: "Customers", icon: Users, roles: ["owner", "admin", "staff"] },
  { href: "/admin/documents", label: "Documents", icon: FileText, roles: ["owner", "admin"] },
  { href: "/admin/follow-ups", label: "Follow-ups", icon: BellRing, roles: ["owner", "admin", "staff"] },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, roles: ["owner"] },
  { href: "/admin/conference-images", label: "Conference", icon: BedDouble, roles: ["owner", "admin"] },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle, roles: ["owner", "admin"] },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, roles: ["owner", "admin"] },
  { href: "/admin/activity-logs", label: "Activity Logs", icon: BarChart3, roles: ["owner", "admin"] },
  { href: "/admin/users", label: "Users", icon: UserCog, roles: ["owner"] },
  { href: "/admin/maintenance", label: "Maintenance", icon: Settings, roles: ["owner"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["owner"] },
];

type Item = (typeof items)[number];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function NavItem({
  item,
  pathname,
  collapsed,
  onItemClick,
}: {
  item: Item & { children?: { href: string; label: string }[] };
  pathname: string;
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const hasChildren = "children" in item && item.children && item.children.length > 0;
  const childActive = hasChildren && item.children!.some((c) => pathname.startsWith(c.href));
  const [open, setOpen] = useState(childActive);

  if (!hasChildren) {
    const active = isActive(pathname, (item as { href: string }).href);
    return (
      <Link
        href={(item as { href: string }).href}
        onClick={onItemClick}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-muted hover:text-neutral-900 md:pl-4",
          collapsed && "md:justify-center md:px-2",
          active && "bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-700"
        )}
      >
        {active && (
          <span className={cn(
            "absolute left-0 top-1/2 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary",
            !collapsed && "md:block",
            collapsed && "md:hidden"
          )} />
        )}
        {active && collapsed && (
          <span className="absolute left-0 top-1/2 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
        )}
        <item.icon className="size-4 shrink-0" />
        {!collapsed && item.label}
      </Link>
    );
  }

  // Parent with children

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex w-full shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-muted hover:text-neutral-900 md:pl-4",
          collapsed && "md:justify-center md:px-2",
          childActive && "bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-700"
        )}
      >
        {childActive && (
          <span className={cn(
            "absolute left-0 top-1/2 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary",
            !collapsed && "md:block",
            collapsed && "md:hidden"
          )} />
        )}
        <item.icon className="size-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={cn(
                "size-3.5 text-neutral-400 transition-transform",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {item.children!.map((child) => {
            const active = isActive(pathname, child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-muted hover:text-neutral-900",
                  active && "bg-primary-50 text-primary-700 hover:bg-primary-100"
                )}
              >
                <span className="size-1 rounded-full bg-current" />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminNav({ role, collapsed, onItemClick }: { role: string; collapsed?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <>
      <nav
        className={cn(
          "flex flex-col gap-0.5 p-2",
          collapsed && "items-center"
        )}
        aria-label="Admin navigation"
      >
        {items
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <NavItem
              key={"href" in item ? item.href : item.label}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onItemClick={onItemClick}
            />
          ))}
      </nav>
      <div className={cn("mt-auto border-t border-neutral-100 p-2", collapsed && "md:flex md:flex-col md:items-center md:gap-1")}>
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          onClick={onItemClick}
          title={collapsed ? "Open website" : undefined}
          className={cn(
            "group relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-muted hover:text-neutral-900",
            collapsed && "md:justify-center md:px-2"
          )}
        >
          <ExternalLink className="size-4 shrink-0" />
          {!collapsed && "Open website"}
        </Link>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(
            "text-neutral-500",
            collapsed ? "size-9" : "w-full justify-start"
          )}
          onClick={async () => {
            onItemClick?.();
            await authClient.signOut();
            router.replace("/login");
            router.refresh();
          }}
        >
          <LogOut className="size-4" />
          {!collapsed && "Sign out"}
        </Button>
      </div>
    </>
  );
}
