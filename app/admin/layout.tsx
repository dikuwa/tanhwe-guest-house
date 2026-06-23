import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { requireAuth } from "@/lib/auth-middleware";

type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email as string,
    role: String(session.user.role),
  } satisfies SafeUser;

  return <AdminLayoutShell session={{ user }}>{children}</AdminLayoutShell>;
}
