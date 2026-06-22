import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAuth } from "@/lib/auth-middleware";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  return (
    <div className="min-h-screen bg-muted/35">
      <aside className="border-b bg-background lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link href="/admin" className="font-heading text-lg font-semibold">
            Tanhwe
          </Link>
          <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            Admin
          </span>
        </div>
        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <AdminNav role={String(session.user.role)} />
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="hidden h-16 items-center justify-end border-b bg-background px-6 lg:flex">
          <div className="text-right">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{String(session.user.role)}</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
