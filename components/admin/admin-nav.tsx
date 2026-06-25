"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BedDouble,
  BellRing,
  BookOpen,
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

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["owner", "admin", "staff"] },
  { href: "/admin/rooms", label: "Rooms", icon: BedDouble, roles: ["owner", "admin"] },
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

export function AdminNav({ role, collapsed }: { role: string; collapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <>
      <nav
        className={cn(
          "flex gap-0.5 overflow-x-auto p-2 lg:flex-col lg:overflow-visible",
          collapsed && "lg:items-center"
        )}
        aria-label="Admin navigation"
      >
        {items
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const active =
              item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:pl-4",
                  collapsed && "lg:justify-center lg:px-2",
                  active &&
                    "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                )}
              >
                {active && (
                  <span className={cn(
                    "absolute left-0 top-1/2 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary",
                    !collapsed && "lg:block",
                    collapsed && "lg:hidden"
                  )} />
                )}
                {active && collapsed && (
                  <span className="absolute left-0 top-1/2 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <item.icon className="size-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
      </nav>
      <div className={cn("mt-auto border-t border-neutral-100 p-2", collapsed && "lg:flex lg:flex-col lg:items-center lg:gap-1")}>
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          title={collapsed ? "Open website" : undefined}
          className={cn(
            "group relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
            collapsed && "lg:justify-center lg:px-2"
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
