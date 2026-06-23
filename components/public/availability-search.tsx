"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Search, Users } from "lucide-react";
import { format } from "date-fns";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type RoomOption = { slug: string; name: string };

export function AvailabilitySearch({
  rooms,
  compact = false,
}: {
  rooms: RoomOption[];
  compact?: boolean;
}) {
  const router = useRouter();
  const today = new Date();
  const [roomSlug, setRoomSlug] = useState(rooms[0]?.slug ?? "");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("1");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const ci = checkIn ? checkIn.toISOString().slice(0, 10) : "";
    const co = checkOut ? checkOut.toISOString().slice(0, 10) : "";
    const params = new URLSearchParams({ checkIn: ci, checkOut: co, guests });
    router.push(`/rooms/${roomSlug}?${params}`);
  }

  // Desktop layout uses two groups with a visual divider
  if (!compact) {
    return (
      <form
        id="booking"
        onSubmit={submit}
        className="space-y-4 sm:space-y-0"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Left group: Room + Guests */}
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:flex-[0_0_auto]">
            <div className="space-y-1.5 sm:w-48">
              <Label
                htmlFor="search-room"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <Users className="mr-1 inline size-3 align-middle" />
                Room &amp; guests
              </Label>
              <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
                <SelectTrigger id="search-room" className="h-12 w-full bg-white">
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
            <div className="space-y-1.5 sm:w-24">
              <Label htmlFor="search-guests" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                &nbsp;
              </Label>
              <Input
                id="search-guests"
                type="number"
                min="1"
                max="30"
                required
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="h-12 bg-white"
              />
            </div>
          </div>

          {/* Vertical divider */}
          <div className="hidden h-12 w-px self-end bg-neutral-200 sm:block" />

          {/* Right group: Dates + button */}
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:justify-end">
            <div className="space-y-1.5 sm:w-36">
              <Label
                htmlFor="search-check-in"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <CalendarDays className="mr-1 inline size-3 align-middle" />
                Check-in
              </Label>
              <Popover>
                <PopoverTrigger>
                  <button
                    id="search-check-in"
                    type="button"
                    className={cn(
                      "flex h-12 w-full items-center rounded-lg border border-neutral-200 bg-white px-3 text-sm shadow-xs transition-colors",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                      checkIn ? "text-neutral-800" : "text-neutral-400"
                    )}
                  >
                    {checkIn ? format(checkIn, "d MMM") : "Check-in"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={(date) => {
                      setCheckIn(date);
                      // Auto-advance check-out
                      if (date && checkOut && date >= checkOut) {
                        const next = new Date(date);
                        next.setDate(next.getDate() + 1);
                        setCheckOut(next);
                      }
                    }}
                    fromDate={today}
                    disabled={{ before: today }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5 sm:w-36">
              <Label htmlFor="search-check-out" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                &nbsp;
              </Label>
              <Popover>
                <PopoverTrigger>
                  <button
                    id="search-check-out"
                    type="button"
                    className={cn(
                      "flex h-12 w-full items-center rounded-lg border border-neutral-200 bg-white px-3 text-sm shadow-xs transition-colors",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                      checkOut ? "text-neutral-800" : "text-neutral-400"
                    )}
                  >
                    {checkOut ? format(checkOut, "d MMM") : "Check-out"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    fromDate={checkIn || today}
                    disabled={{ before: checkIn || today }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" size="lg" className="h-12 shrink-0 px-8" disabled={!roomSlug}>
              <CalendarDays className="mr-2 size-4" />
              Check dates
            </Button>
          </div>
        </div>
      </form>
    );
  }

  // Compact variant (rooms listing page)
  return (
    <form
      id="booking"
      onSubmit={submit}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.6fr_auto]"
    >
      <div className="space-y-1.5">
        <Label htmlFor="search-room-compact">Room</Label>
        <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
          <SelectTrigger id="search-room-compact" className="h-10 w-full bg-background">
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
        <Label htmlFor="search-check-in-c">Check-in</Label>
        <Popover>
          <PopoverTrigger>
            <button
              id="search-check-in-c"
              type="button"
              className={cn(
                "flex h-10 w-full items-center rounded-md border border-neutral-200 bg-background px-3 text-sm shadow-xs transition-colors",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                checkIn ? "text-neutral-800" : "text-neutral-400"
              )}
            >
              {checkIn ? format(checkIn, "d MMM") : "Check-in"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={(date) => {
                setCheckIn(date);
                if (date && checkOut && date >= checkOut) {
                  const next = new Date(date);
                  next.setDate(next.getDate() + 1);
                  setCheckOut(next);
                }
              }}
              fromDate={today}
              disabled={{ before: today }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="search-check-out-c">Check-out</Label>
        <Popover>
          <PopoverTrigger>
            <button
              id="search-check-out-c"
              type="button"
              className={cn(
                "flex h-10 w-full items-center rounded-md border border-neutral-200 bg-background px-3 text-sm shadow-xs transition-colors",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                checkOut ? "text-neutral-800" : "text-neutral-400"
              )}
            >
              {checkOut ? format(checkOut, "d MMM") : "Check-out"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={setCheckOut}
              fromDate={checkIn || today}
              disabled={{ before: checkIn || today }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="search-guests-c">Guests</Label>
        <Input
          id="search-guests-c"
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
        <Search className="size-4" />
        Search
      </Button>
    </form>
  );
}
