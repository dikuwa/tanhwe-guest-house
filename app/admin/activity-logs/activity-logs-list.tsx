"use client";

import { useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  createdAt: Date;
  userName: string | null;
  userRole: string | null;
};

type Query = {
  q?: string;
  action?: string;
  entity?: string;
  page?: string;
};

export function ActivityLogsList({
  rows,
  total,
  page,
  pageCount,
  currentQuery,
}: {
  rows: LogRow[];
  total: number;
  page: number;
  pageCount: number;
  currentQuery: Query;
}) {
  const router = useRouter();

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams();
    const qVal = String(currentQuery.q || "");
    const actionVal = String(currentQuery.action || "");
    const entityVal = String(currentQuery.entity || "");
    if (qVal) params.set("q", qVal);
    if (actionVal && key !== "action") params.set("action", actionVal);
    if (entityVal && key !== "entity") params.set("entity", entityVal);
    if (value) params.set(key, value);
    params.set("page", "1");
    router.push(`/admin/activity-logs?${String(params)}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    const qVal = String(currentQuery.q || "");
    const actionVal = String(currentQuery.action || "");
    const entityVal = String(currentQuery.entity || "");
    if (qVal) params.set("q", qVal);
    if (actionVal) params.set("action", actionVal);
    if (entityVal) params.set("entity", entityVal);
    params.set("page", String(p));
    router.push(`/admin/activity-logs?${String(params)}`);
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") || "");
            applyFilter("q", q);
          }}
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
          <Input
            name="q"
            defaultValue={currentQuery.q || ""}
            placeholder="Search details or entity..."
            className="h-8 pl-8 text-xs"
          />
        </form>
        <Select
          value={currentQuery.action || ""}
          onValueChange={(v) => applyFilter("action", v ?? "")}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <Filter className="size-3" />
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={currentQuery.entity || ""}
          onValueChange={(v) => applyFilter("entity", v ?? "")}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <Filter className="size-3" />
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All entities</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="room">Room</SelectItem>
            <SelectItem value="follow-up">Follow-up</SelectItem>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
            <SelectItem value="testimonial">Testimonial</SelectItem>
            <SelectItem value="setting">Setting</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-xs">
        <table className="w-full min-w-140 text-left text-xs">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Date &amp; Time</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Entity</th>
              <th className="px-3 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center text-neutral-500 text-xs">
                  No activity logs found matching your filters.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="whitespace-nowrap px-3 py-2 text-neutral-500 text-[11px]">
                  {new Date(row.createdAt).toLocaleDateString("en-NA", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium text-neutral-700 text-[11px]">{String(row.userName || "System")}</span>
                  {row.userRole && (
                    <span className="ml-1 text-[10px] text-neutral-400">({row.userRole})</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-neutral-600">
                    {row.action}
                  </span>
                </td>
                <td className="px-3 py-2 capitalize text-neutral-600 text-[11px]">{row.entity}</td>
                <td className="max-w-56 truncate px-3 py-2 text-neutral-500 text-[11px]">
                  {row.details || <span className="italic text-neutral-300">&mdash;</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[11px]">
        <p className="text-neutral-500">
          {total} log{total === 1 ? "" : "s"}
        </p>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="xs"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={page >= pageCount}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
