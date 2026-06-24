import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCustomers, getDuplicateCustomerCandidates } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";

const money = new Intl.NumberFormat("en-NA", { style: "currency", currency: "NAD" });

export default async function AdminCustomers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireRole(["owner", "admin", "staff"]);
  const query = await searchParams;
  const [data, duplicateResult] = await Promise.all([
    getCustomers({ query: query.q, page: Number(query.page) || 1 }),
    session.user.role === "staff" ? Promise.resolve([]) : getDuplicateCustomerCandidates(),
  ]);
  const duplicates = duplicateResult;
  const showFinancials = session.user.role !== "staff";
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Customers</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Guest contact details, stay history, and outstanding follow-up.
          </p>
        </div>
        <Button render={<Link href="/admin/customers/create" />}>
          <Plus className="size-4" />
          Add customer
        </Button>
      </header>
      {duplicates.length > 0 && (
        <aside className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="font-medium">Possible duplicate customers</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Review these exact phone or email matches. Records are never merged automatically.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {duplicates.map((group) => (
              <span
                key={`${group.matchType}-${group.identifier}`}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {group.names.join(" / ")} · {group.matchType}
              </span>
            ))}
          </div>
        </aside>
      )}
      <form className="flex max-w-xl gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query.q}
            placeholder="Search name, phone, WhatsApp, or email"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-200 text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Stays</th>
              {showFinancials && (
                <>
                  <th className="px-4 py-3">Booked value</th>
                  <th className="px-4 py-3">Outstanding</th>
                </>
              )}
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((customer) => (
              <tr key={customer.id} className="border-b last:border-0">
                <td className="px-4 py-4 font-medium">
                  {customer.fullName}
                  {customer.email && (
                    <p className="mt-1 text-xs font-normal text-muted-foreground">
                      {customer.email}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <a
                    href={`tel:${customer.phone.replace(/[^+\d]/g, "")}`}
                    className="text-secondary hover:underline"
                  >
                    {customer.phone}
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">WhatsApp {customer.whatsapp}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline">{customer.totalStays}</Badge>
                </td>
                {showFinancials && (
                  <>
                    <td className="px-4 py-4 tabular-nums">{money.format(customer.totalBooked)}</td>
                    <td className="px-4 py-4 tabular-nums">{money.format(customer.outstanding)}</td>
                  </>
                )}
                <td className="px-4 py-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/admin/customers/${customer.id}`} />}
                  >
                    View profile
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.rows.length && (
          <div className="grid place-items-center px-6 py-16 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No customers found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer records are created with booking requests.
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {data.total} customer{data.total === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            render={
              data.page > 1 ? (
                <Link href={`?q=${encodeURIComponent(query.q ?? "")}&page=${data.page - 1}`} />
              ) : undefined
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.pageCount}
            render={
              data.page < data.pageCount ? (
                <Link href={`?q=${encodeURIComponent(query.q ?? "")}&page=${data.page + 1}`} />
              ) : undefined
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
