import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Bath, Check, Coffee, MapPin, Users, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookingRequestForm } from "@/components/public/booking-request-form";
import { ContactActions } from "@/components/public/contact-actions";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicRoom, getPublicSettings } from "@/lib/public-data";
import { roomFallbackImage } from "@/lib/images";

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
  const amenityIcons = [Wifi, Coffee, Bath];
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
              {room.breakfastIncluded && <Badge>Breakfast included</Badge>}
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
        <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted lg:aspect-auto lg:min-h-[500px]">
            <Image
              src={room.imageUrl ?? roomFallbackImage.url}
              alt={
                room.imageUrl
                  ? `${room.name} at Tanhwe Guest House`
                  : roomFallbackImage.alt
              }
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 70vw"
              className="object-cover"
              style={room.imageUrl ? undefined : { objectPosition: "50% 16%" }}
            />
          </div>
          {room.images.length > 1 && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {room.images.slice(1, 3).map((image) => (
                <div
                  key={image.url}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 30vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
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
                ).map((amenity, index) => {
                  const Icon = amenityIcons[index % amenityIcons.length];
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
              />
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
