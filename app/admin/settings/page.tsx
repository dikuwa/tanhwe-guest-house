import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSettings } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
export default async function AdminSettings() {
  await requireRole(["owner"]);
  const settings = await getAdminSettings();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Public contact details and stay defaults. Credentials remain in environment variables.
        </p>
      </header>
      <SettingsForm settings={settings} />
    </div>
  );
}
