import { requireRole } from "@/lib/auth-middleware";

export default async function AdminDashboard() {
  const session = await requireRole(["owner", "admin", "staff"]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-playfair font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.email}</p>
        <p className="text-muted-foreground">Dashboard will be built in Phase 5</p>
      </div>
    </div>
  );
}
