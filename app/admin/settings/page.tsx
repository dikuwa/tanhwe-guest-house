import { SettingsForm } from "@/components/admin/settings-form";
import { ProfilePicture } from "@/components/admin/profile-picture";
import { getAdminSettings } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
export default async function AdminSettings() {
  const session = await requireRole(["owner"]);
  const [user] = await getDb()
    .select({ id: users.id, name: users.name, email: users.email, image: users.image })
    .from(users)
    .where(eq(users.id, session.user.id));
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

      {/* Profile section */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-neutral-800">Your Profile</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {user.name} &middot; {user.email}
        </p>
        <div className="mt-5">
          <ProfilePicture
            currentImage={user.image}
            userName={user.name}
            userId={user.id}
          />
        </div>
      </section>

      <SettingsForm settings={settings} />
    </div>
  );
}
