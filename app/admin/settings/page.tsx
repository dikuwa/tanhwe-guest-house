import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSettings } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
export default async function AdminSettings() {
  await requireRole(["owner"]);
  const settings = await getAdminSettings();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Configuration</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Public contact details and stay defaults. Credentials remain in environment variables.
        </p>
      </header>
      <SettingsForm settings={settings} />
    </div>
  );
}
