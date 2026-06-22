import Image from "next/image";
import Link from "next/link";
import { BedDouble, Coffee, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { PublicRoom } from "@/lib/public-data";
import poster from "@/docs/assets/inspiration-1.jpeg";

export function RoomCard({ room, currency = "N$" }: { room: PublicRoom; currency?: string }) {
  return (
    <article className="group overflow-hidden rounded-xl border bg-card">
      <Link href={`/rooms/${room.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={room.imageUrl ?? poster}
          alt={room.imageUrl ? `${room.name} at Tanhwe Guest House` : "Tanhwe Guest House accommodation"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          style={room.imageUrl ? undefined : { objectPosition: "50% 13%" }}
        />
        {room.breakfastIncluded && <Badge className="absolute left-3 top-3 bg-background/95 text-foreground">Breakfast included</Badge>}
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">{room.type}</p>
            <h3 className="mt-1 font-playfair text-2xl font-bold"><Link href={`/rooms/${room.slug}`}>{room.name}</Link></h3>
          </div>
          <p className="shrink-0 text-right"><span className="text-lg font-bold">{currency}{room.pricePerNight}</span><br/><span className="text-xs text-muted-foreground">per night</span></p>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="size-4" />Up to {room.maxGuests}</span>
          <span className="flex items-center gap-1.5"><BedDouble className="size-4" />{room.availableUnits} unit{room.availableUnits === 1 ? "" : "s"}</span>
          {room.breakfastIncluded && <span className="flex items-center gap-1.5"><Coffee className="size-4" />Breakfast</span>}
        </div>
        <Link href={`/rooms/${room.slug}`} className={`${buttonVariants({ variant: "outline" })} mt-5 w-full`}>View room</Link>
      </div>
    </article>
  );
}
