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
    roles: ["owner", "admin", "staff"],
  },
  {
    href: "/admin/follow-ups",
    label: "Follow-ups",
    icon: BellRing,
    roles: ["owner", "admin", "staff"],
  },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["owner", "admin"] },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <>
      <nav
        className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible"
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
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  active &&
                    "bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
      <div className="hidden border-t p-3 lg:block">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={async () => {
            await authClient.signOut();
            router.replace("/login");
            router.refresh();
          }}
        >
          <LogOut />
          Sign out
        </Button>
      </div>
    </>
  );
}
