"use client";

import { cn } from "@/lib/utils";

const statusColorMap: Record<string, string> = {
  available: "bg-blue-100 text-blue-800",
  cleaning: "bg-yellow-100 text-yellow-800",
  maintenance: "bg-orange-100 text-orange-800",
  blocked: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-600",
  active: "bg-blue-100 text-blue-800",
  invited: "bg-blue-100 text-blue-800",
  disabled: "bg-yellow-100 text-yellow-800",
  revoked: "bg-red-100 text-red-800",
  locked: "bg-gray-200 text-gray-700",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function StatusPill({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
        statusColorMap[status] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {label ?? capitalize(status)}
    </span>
  );
}
