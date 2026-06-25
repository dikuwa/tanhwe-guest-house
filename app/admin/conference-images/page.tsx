import { requireRole } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { conferenceImages } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { ConferenceImagesManager } from "./conference-images-manager";

export const dynamic = "force-dynamic";

export default async function AdminConferenceImages() {
  await requireRole(["owner", "admin"]);
  const images = await getDb()
    .select()
    .from(conferenceImages)
    .orderBy(asc(conferenceImages.sortOrder));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Media</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">
          Conference Images
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage images displayed on the conference page. Up to 5 images. First image is the lead.
        </p>
      </header>
      <ConferenceImagesManager initialImages={images} />
    </div>
  );
}
