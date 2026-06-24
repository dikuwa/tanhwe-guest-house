import { TestimonialManager } from "./testimonial-manager";
import { getDb } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-middleware";
import { asc } from "drizzle-orm";

export default async function AdminTestimonialsPage() {
  await requireRole(["owner", "admin"]);
  const items = await getDb().select().from(testimonials).orderBy(asc(testimonials.sortOrder));
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Website Content</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">Testimonials</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Guest testimonials displayed on the homepage carousel. Only active testimonials appear publicly.
        </p>
      </header>
      <TestimonialManager initial={items} />
    </div>
  );
}
