import { FaqManager } from "./faq-manager";
import { getDb } from "@/lib/db";
import { faqs } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-middleware";
import { asc } from "drizzle-orm";

export default async function AdminFaqsPage() {
  await requireRole(["owner", "admin"]);
  const items = await getDb().select().from(faqs).orderBy(asc(faqs.sortOrder));
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Website Content</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">FAQs</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Frequently asked questions shown on the homepage. Only active FAQs are displayed publicly.
        </p>
      </header>
      <FaqManager initial={items} />
    </div>
  );
}
