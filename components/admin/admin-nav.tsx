"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BedDouble,
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  BellRing,
  BarChart3,
  UserCog,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["owner", "admin", "staff"] },
  { href: "/admin/rooms", label: "Rooms", icon: BedDouble, roles: ["owner", "admin"] },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: BookOpen,
    roles: ["owner", "admin", "staff"],
  },
  { href: "/admin/customers", label: "Customers", icon: Users, roles: ["owner", "admin", "staff"] },
  {
    href: "/admin/documents",
    label: "Documents",
    icon: FileText,
    roles: ["owner", "admin"],
  },
  {
    href: "/admin/follow-ups",
    label: "Follow-ups",
    icon: BellRing,
    roles: ["owner", "admin", "staff"],
  },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, roles: ["owner"] },
  { href: "/admin/users", label: "Users", icon: UserCog, roles: ["owner"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["owner"] },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <>
      <nav
        className="flex gap-0.5 overflow-x-auto p-2 lg:flex-col lg:overflow-visible"
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
                className={cn(
                  "group relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:pl-4",
                  active &&
                    "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary lg:block" />
                )}
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
      </nav>
      <div className="mt-auto border-t border-neutral-100 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-neutral-500"
          onClick={async () => {
            await authClient.signOut();
            router.replace("/login");
            router.refresh();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </>
  );
}
