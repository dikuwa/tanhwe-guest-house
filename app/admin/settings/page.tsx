import { CategorizedSettings } from "./categorized-settings";
import { ProfileNameForm } from "@/components/admin/profile-name-form";
import { ProfilePicture } from "@/components/admin/profile-picture";
import { getAdminSettings, getDocumentSettings } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const CATEGORIES = {
  business: ["business_name", "physical_address", "town", "region", "country", "business_email", "primary_phone", "website_url", "logo_url"],
  banking: ["banking_account_name", "banking_account_number", "banking_bank_name", "banking_branch_name", "banking_branch_code", "banking_account_type", "banking_swift_bic", "document_banking_visible"],
  payment: ["payment_bank_transfer_enabled", "payment_bank_transfer_title", "payment_bank_transfer_instructions", "payment_mobile_wallets_enabled", "payment_mobile_wallets_title", "payment_mobile_wallet_description", "payment_supported_wallets"],
  document: ["document_payment_visible", "document_signature_visible", "document_signatory_name", "document_signatory_role", "document_manager_role_label", "document_signature_image", "document_secure_footer_visible", "document_secure_footer_message", "accepted_payment_types", "document_footer_text"],
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business Information",
  banking: "Banking Information",
  payment: "Payment Settings",
  document: "Document Settings",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  business: "Business name, address, and contact details used on documents.",
  banking: "Bank account details shown on invoices and receipts.",
  payment: "Payment method options displayed to guests.",
  document: "Document presentation settings and owner information.",
};

export default async function AdminSettings() {
  const session = await requireRole(["owner"]);
  const [user] = await getDb()
    .select({ id: users.id, name: users.name, email: users.email, image: users.image })
    .from(users)
    .where(eq(users.id, session.user.id));
  const allSettings = await getAdminSettings();
  const docSettings = await getDocumentSettings();

  const grouped: { key: string; label: string; description: string; settings: { id: string; key: string; value: string; description: string | null }[] }[] = Object.entries(CATEGORIES).map(([key, settingKeys]) => ({
    key,
    label: CATEGORY_LABELS[key] ?? key,
    description: CATEGORY_DESCRIPTIONS[key] ?? "",
    settings: allSettings.filter((s) => (settingKeys as readonly string[]).includes(s.key)),
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Configuration</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your business, banking, payment, and document information.
        </p>
      </header>

      {/* Profile */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-neutral-800">Your Profile</h2>
        <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
        <div className="mt-5 space-y-5">
          <ProfilePicture currentImage={user.image} userName={user.name} userId={user.id} />
          <ProfileNameForm userName={user.name} />
        </div>
      </section>

      {/* Categorized settings */}
      <CategorizedSettings groups={grouped} />
    </div>
  );
}
