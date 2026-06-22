import { requireRole } from "@/lib/auth-middleware";

export default async function AdminSettings() {
  await requireRole(["owner"]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-playfair font-bold mb-4">Settings</h1>
        <p className="text-muted-foreground">Settings will be built in Phase 8</p>
      </div>
    </div>
  );
}
