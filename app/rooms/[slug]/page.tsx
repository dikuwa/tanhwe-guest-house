import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Coffee, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookingRequestForm } from "@/components/public/booking-request-form";
import { ContactActions } from "@/components/public/contact-actions";
import { RoomGallery } from "@/components/public/room-gallery";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicRoom, getPublicSettings } from "@/lib/public-data";
import { getAmenityIcon, getAmenityLabel } from "@/lib/amenity-icons";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await getPublicRoom((await params).slug);
  return room ? { title: `${room.name} | Tanhwe Guest House`, description: room.description } : {};
}

export default async function RoomDetailPage({ params, searchParams }: Props) {
  const [room, settings, query] = await Promise.all([
    getPublicRoom((await params).slug),
    getPublicSettings(),
    searchParams,
  ]);
  if (!room) notFound();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-secondary">
                <MapPin />
                {settings.location}
              </Badge>
            </div>
            <h1 className="mt-4 font-heading text-4xl font-bold sm:text-6xl">{room.name}</h1>
          </div>
          <p className="text-right">
            <span className="text-2xl font-bold">
              {settings.currency}
              {room.pricePerNight}
            </span>
            <br />
            <span className="text-sm text-muted-foreground">per room, per night</span>
          </p>
        </div>
        <RoomGallery
          images={room.images}
          roomName={room.name}
          heroImageUrl={room.imageUrl}
        />
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div>
            <div className="flex flex-wrap gap-6 border-b pb-8 text-sm">
              <span className="flex items-center gap-2">
                <Users className="size-5 text-secondary" />
                Up to {room.maxGuests} guests
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-5 text-secondary" />
                {room.availableUnits} unit{room.availableUnits === 1 ? "" : "s"}
              </span>
              {room.breakfastIncluded && (
                <span className="flex items-center gap-2">
                  <Coffee className="size-5 text-secondary" />
                  Breakfast included
                </span>
              )}
            </div>
            <section className="py-10">
              <h2 className="font-heading text-3xl font-bold">A comfortable base in Mukwe.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                {room.description ??
                  "A clean, comfortable room prepared for an easy stay at Tanhwe Guest House."}
              </p>
            </section>
            <section className="border-t py-10">
              <h2 className="font-heading text-3xl font-bold">Room amenities</h2>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {(room.amenities.length
                  ? room.amenities
                  : ["Wi-Fi", "Breakfast included", "Ensuite bathroom"]
                ).map((amenity) => {
                  const lower = amenity.toLowerCase();
                  const predefined = [
                    { match: "wifi", iconKey: "wifi" },
                    { match: "breakfast", iconKey: "coffee" },
                    { match: "bathroom", iconKey: "bath" },
                    { match: "shower", iconKey: "shower-head" },
                    { match: "ac", iconKey: "snowflake" },
                    { match: "air conditioning", iconKey: "snowflake" },
                    { match: "fan", iconKey: "fan" },
                    { match: "parking", iconKey: "car" },
                    { match: "tv", iconKey: "tv" },
                    { match: "desk", iconKey: "lamp-desk" },
                    { match: "towels", iconKey: "bath" },
                    { match: "toiletries", iconKey: "package-check" },
                    { match: "housekeeping", iconKey: "sparkles" },
                    { match: "room service", iconKey: "concierge-bell" },
                    { match: "tea", iconKey: "coffee" },
                    { match: "fridge", iconKey: "refrigerator" },
                    { match: "balcony", iconKey: "sun" },
                    { match: "garden", iconKey: "trees" },
                    { match: "conference", iconKey: "presentation" },
                  ].find((p) => lower.includes(p.match));
                  const Icon = getAmenityIcon(predefined?.iconKey ?? null);
                  return (
                    <div key={amenity} className="flex items-center gap-3">
                      <Icon className="size-5 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="border-t py-10">
              <h2 className="font-heading text-3xl font-bold">Good to know</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="mt-1 font-semibold">From {settings.checkInTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="mt-1 font-semibold">By {settings.checkOutTime}</p>
                </div>
              </div>
              <ContactActions
                phone={settings.phone}
                whatsapp={settings.whatsapp}
                message={`Hello Tanhwe Guest House, I would like to enquire about the ${room.name}.`}
                className="mt-8"
              />
            </section>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border bg-card p-6 shadow-[0_20px_60px_-48px_rgba(17,24,39,.55)]">
              <BookingRequestForm
                roomId={room.id}
                roomName={room.name}
                pricePerNight={room.pricePerNight}
                maxGuests={room.maxGuests}
                availableUnits={room.availableUnits}
                currency={settings.currency}
                initialCheckIn={query.checkIn}
                initialCheckOut={query.checkOut}
                initialGuests={query.guests}
                showPayment={settings.paymentEnabled}
              />
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
