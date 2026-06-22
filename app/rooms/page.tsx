import type { Metadata } from "next";
import { AvailabilitySearch } from "@/components/public/availability-search";
import { RoomCard } from "@/components/public/room-card";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicRooms, getPublicSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Rooms | Tanhwe Guest House", description: "Browse accommodation at Tanhwe Guest House in Mukwe, Namibia." };
export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const [rooms, settings] = await Promise.all([getPublicRooms(), getPublicSettings()]);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-[color-mix(in_oklch,var(--secondary)_8%,var(--background))] px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-[1180px]"><p className="text-sm font-semibold text-secondary">Stay in Mukwe</p><h1 className="mt-3 font-playfair text-5xl font-bold tracking-tight sm:text-6xl">Find your room.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Clear nightly prices, breakfast included, and a direct line to the people preparing your stay.</p></div>
        </section>
        <section className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6"><div className="rounded-xl border bg-card p-5"><AvailabilitySearch compact rooms={rooms.map(({ slug, name }) => ({ slug, name }))} /></div></section>
        <section className="mx-auto max-w-[1180px] px-4 pb-24 pt-8 sm:px-6 lg:pb-32">
          <div className="flex items-end justify-between gap-4"><div><h2 className="font-playfair text-3xl font-bold">Available room types</h2><p className="mt-2 text-sm text-muted-foreground">Final availability is confirmed after your request.</p></div><p className="text-sm font-semibold">{rooms.length} room type{rooms.length === 1 ? "" : "s"}</p></div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{rooms.map((room) => <RoomCard key={room.id} room={room} currency={settings.currency} />)}</div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
