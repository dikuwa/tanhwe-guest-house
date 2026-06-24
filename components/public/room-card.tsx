import Image from "next/image";
import Link from "next/link";
import { BedDouble, Coffee, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublicRoom } from "@/lib/public-data";
import { roomFallbackImage } from "@/lib/images";

export function RoomCard({ room, currency = "N$" }: { room: PublicRoom; currency?: string }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-sm">
      <Link
        href={`/rooms/${room.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
      >
        <Image
          src={room.imageUrl ?? roomFallbackImage.url}
          alt={
            room.imageUrl
              ? `${room.name} at Tanhwe Guest House`
              : roomFallbackImage.alt
          }
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 ease-out group-hover:scale-105"
          style={room.imageUrl ? undefined : { objectPosition: "50% 13%" }}
        />
        {room.breakfastIncluded && (
          <Badge className="absolute left-3 top-3 border-0 bg-background/90 text-foreground backdrop-blur-sm">
            <Coffee className="mr-1 size-3" />
            Breakfast included
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              {room.type}
            </p>
            <h3 className="mt-1 truncate font-heading text-xl font-bold">
              <Link href={`/rooms/${room.slug}`} className="hover:text-primary transition-colors">
                {room.name}
              </Link>
            </h3>
          </div>
          <p className="shrink-0 text-right">
            <span className="text-lg font-bold tabular-nums text-primary">
              {currency}{room.pricePerNight}
            </span>
            <br />
            <span className="text-xs text-muted-foreground">per night</span>
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            Up to {room.maxGuests} guest{room.maxGuests === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="size-3.5" />
            {room.availableUnits} unit{room.availableUnits === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-auto pt-4">
          <div className="mb-4 border-t border-border" />
          <Link
            href={`/rooms/${room.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            View room details
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
