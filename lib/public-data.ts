import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import { faqs, roomAmenities, roomImages, roomTypes, rooms, roomUnits, settings, testimonials } from "./db/schema";

export type PublicRoom = {
  id: string;
  roomTypeId: string | null;
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
  bedConfiguration: string | null;
};

export async function getPublicRooms(): Promise<PublicRoom[]> {
  const db = getDb();
  const roomRows = await db
    .select({
      id: rooms.id,
      name: rooms.name,
      slug: rooms.slug,
      type: rooms.type,
      description: rooms.description,
      pricePerNight: rooms.pricePerNight,
      availableUnits: rooms.availableUnits,
      maxGuests: rooms.maxGuests,
      breakfastIncluded: rooms.breakfastIncluded,
      featured: rooms.featured,
      roomTypeId: rooms.roomTypeId,
    })
    .from(rooms)
    .where(eq(rooms.status, "active"))
    .orderBy(asc(rooms.pricePerNight));
  if (!roomRows.length) return [];

  const [images, amenities, unitCounts, typeRows] = await Promise.all([
    db.select().from(roomImages).orderBy(asc(roomImages.sortOrder)),
    db.select().from(roomAmenities).orderBy(asc(roomAmenities.amenity)),
    db
      .select({
        roomId: roomUnits.roomId,
        count: sql<number>`count(*)::int`,
      })
      .from(roomUnits)
      .where(
        and(
          eq(roomUnits.isActive, true),
          inArray(roomUnits.operationalStatus, ["available", "cleaning"])
        )
      )
      .groupBy(roomUnits.roomId),
    db.select().from(roomTypes),
  ]);

  const unitCountMap = new Map<string, number>();
  for (const room of roomRows) {
    unitCountMap.set(room.id, 0);
  }
  for (const uc of unitCounts) {
    unitCountMap.set(uc.roomId, uc.count);
  }

  return roomRows.map((room) => {
    const typeInfo = typeRows.find((t) => t.id === room.roomTypeId);
    return {
      ...room,
      description: room.description ?? typeInfo?.description ?? null,
      pricePerNight: room.pricePerNight,
      bedConfiguration: typeInfo?.bedConfiguration ?? null,
      availableUnits: unitCountMap.get(room.id) ?? room.availableUnits,
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
    };
  });
}

export async function getPublicRoom(slug: string): Promise<PublicRoom | null> {
  const db = getDb();
  const room = await db.query.rooms.findFirst({
    where: and(eq(rooms.slug, slug), eq(rooms.status, "active")),
  });
  if (!room) return null;

  const [images, amenities, unitCount, typeRow] = await Promise.all([
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
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(roomUnits)
      .where(
        and(
          eq(roomUnits.roomId, room.id),
          eq(roomUnits.isActive, true),
          inArray(roomUnits.operationalStatus, ["available", "cleaning"])
        )
      ),
    room.roomTypeId
      ? db.query.roomTypes.findFirst({ where: eq(roomTypes.id, room.roomTypeId) })
      : null,
  ]);

  const typeInfo = typeRow ?? null;

  return {
    ...room,
    description: room.description ?? typeInfo?.description ?? null,
    bedConfiguration: typeInfo?.bedConfiguration ?? null,
    availableUnits: unitCount[0]?.count ?? room.availableUnits,
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
  const locationPinFallback =
    "https://www.google.com/maps/place/18%C2%B002'20.6%22S+21%C2%B025'22.5%22E/@-18.0390503,21.4203293,991m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d-18.0390503!4d21.4229042?hl=en&entry=ttu";
  const configuredLocationPin = map.get("location_pin_url")?.trim();
  return {
    phone: map.get("phone") ?? "+264 81 380 8097",
    whatsapp: map.get("whatsapp") ?? "+264 81 380 8097",
    location: map.get("location") ?? "Mukwe, Namibia",
    locationPinUrl: configuredLocationPin?.startsWith("https://")
      ? configuredLocationPin
      : locationPinFallback,
    locationRequestMessage:
      map.get("whatsapp_location_message") ??
      "Hello Tanhwe Guest House. Please send me your location pin and directions.",
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
