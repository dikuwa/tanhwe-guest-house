"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RoomOption = { slug: string; name: string };

export function AvailabilitySearch({
  rooms,
  compact = false,
}: {
  rooms: RoomOption[];
  compact?: boolean;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [roomSlug, setRoomSlug] = useState(rooms[0]?.slug ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut, guests });
    router.push(`/rooms/${roomSlug}?${params}`);
  }

  return (
    <form
      id="booking"
      onSubmit={submit}
      className={`grid gap-3 sm:grid-cols-2 ${compact ? "lg:grid-cols-[1.3fr_1fr_1fr_.6fr_auto]" : "lg:grid-cols-[1.35fr_1fr_1fr_.6fr_auto]"}`}
    >
      <div className="space-y-1.5">
        <Label htmlFor="search-room">Room</Label>
        <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
          <SelectTrigger id="search-room" className="h-10 w-full bg-background">
            <SelectValue placeholder="Select a room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.slug} value={room.slug}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="search-check-in">Check-in</Label>
        <Input
          id="search-check-in"
          type="date"
          min={today}
          required
          value={checkIn}
          onChange={(event) => setCheckIn(event.target.value)}
          className="h-10 bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="search-check-out">Check-out</Label>
        <Input
          id="search-check-out"
          type="date"
          min={checkIn || today}
          required
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
          className="h-10 bg-background"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="search-guests">Guests</Label>
        <Input
          id="search-guests"
          type="number"
          min="1"
          max="30"
          required
          value={guests}
          onChange={(event) => setGuests(event.target.value)}
          className="h-10 bg-background"
        />
      </div>
      <Button type="submit" size="lg" className="h-10 self-end" disabled={!roomSlug}>
        {compact ? <Search className="size-4" /> : <CalendarDays className="size-4" />}
        {compact ? "Search" : "Check dates"}
      </Button>
    </form>
  );
}
