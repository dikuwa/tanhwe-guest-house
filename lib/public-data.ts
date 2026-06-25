import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { faqs, roomAmenities, roomImages, rooms, settings, testimonials } from "./db/schema";

export type PublicRoom = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  pricePerNight: number;
  availableUnits: number;
  maxGuests: number;
  breakfastIncluded: boolean;
  featured: boolean;
  imageUrl: string | null;
  images: { url: string; alt: string }[];
  amenities: string[];
};

export async function getPublicRooms(): Promise<PublicRoom[]> {
  const db = getDb();
  const roomRows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.status, "active"))
    .orderBy(asc(rooms.pricePerNight));
  if (!roomRows.length) return [];

  const [images, amenities] = await Promise.all([
    db.select().from(roomImages).orderBy(asc(roomImages.sortOrder)),
    db.select().from(roomAmenities).orderBy(asc(roomAmenities.amenity)),
  ]);

  return roomRows.map((room) => ({
    ...room,
    imageUrl:
      images.find((image) => image.roomId === room.id && image.isPrimary)?.imageUrl ??
      images.find((image) => image.roomId === room.id)?.imageUrl ??
      null,
    images: images
      .filter((image) => image.roomId === room.id)
      .map((image) => ({
        url: image.imageUrl,
        alt: image.altText ?? `${room.name} at Tanhwe Guest House`,
      })),
    amenities: amenities
      .filter((amenity) => amenity.roomId === room.id)
      .map((amenity) => amenity.amenity),
  }));
}

export async function getPublicRoom(slug: string): Promise<PublicRoom | null> {
  const db = getDb();
  const room = await db.query.rooms.findFirst({
    where: and(eq(rooms.slug, slug), eq(rooms.status, "active")),
  });
  if (!room) return null;

  const [images, amenities] = await Promise.all([
    db
      .select()
      .from(roomImages)
      .where(eq(roomImages.roomId, room.id))
      .orderBy(asc(roomImages.sortOrder)),
    db
      .select()
      .from(roomAmenities)
      .where(eq(roomAmenities.roomId, room.id))
      .orderBy(asc(roomAmenities.amenity)),
  ]);

  return {
    ...room,
    imageUrl: images.find((image) => image.isPrimary)?.imageUrl ?? images[0]?.imageUrl ?? null,
    images: images.map((image) => ({
      url: image.imageUrl,
      alt: image.altText ?? `${room.name} at Tanhwe Guest House`,
    })),
    amenities: amenities.map((amenity) => amenity.amenity),
  };
}

export async function getPublicFaqs() {
  return getDb()
    .select()
    .from(faqs)
    .where(eq(faqs.active, true))
    .orderBy(asc(faqs.sortOrder));
}

export async function getPublicTestimonials() {
  return getDb()
    .select()
    .from(testimonials)
    .where(eq(testimonials.active, true))
    .orderBy(asc(testimonials.sortOrder));
}

export async function getPublicSettings() {
  const values = await getDb().select().from(settings);
  const map = new Map(values.map((item) => [item.key, item.value]));
  return {
    phone: map.get("phone") ?? "+264 81 380 8097",
    whatsapp: map.get("whatsapp") ?? "+264 81 380 8097",
    location: map.get("location") ?? "Mukwe, Namibia",
    checkInTime: map.get("check_in_time") ?? "14:00",
    checkOutTime: map.get("check_out_time") ?? "10:00",
    currency: map.get("currency") ?? "N$",
    email: map.get("email") ?? "",
    bankTransferEnabled: map.get("payment_bank_transfer_enabled") === "true",
    mobileWalletsEnabled: map.get("payment_mobile_wallets_enabled") === "true",
    paymentEnabled:
      map.get("payment_bank_transfer_enabled") === "true" ||
      map.get("payment_mobile_wallets_enabled") === "true",
  };
}
