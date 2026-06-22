import { requireAuth } from "@/lib/auth-middleware";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return children;
}
