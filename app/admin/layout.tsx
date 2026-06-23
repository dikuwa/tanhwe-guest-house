import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAuth } from "@/lib/auth-middleware";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className="border-b bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-60 lg:flex-col lg:border-b-0 lg:border-r lg:border-neutral-200">
        <div className="flex h-14 items-center justify-between border-b border-neutral-100 px-4 lg:h-14">
          <Link href="/admin" className="font-heading text-base font-bold tracking-tight">
            <span className="text-secondary">Tanhwe</span>{" "}
            <span className="text-primary">Admin</span>
          </Link>
        </div>
        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <AdminNav role={String(session.user.role)} />
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="hidden h-14 items-center justify-end border-b border-neutral-100 bg-white px-6 lg:flex">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-800">{session.user.name}</p>
              <p className="text-xs capitalize text-neutral-500">{String(session.user.role)}</p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-600">
              {String(session.user.name).charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
