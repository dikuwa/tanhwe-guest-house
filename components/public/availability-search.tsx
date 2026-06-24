"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BedDouble, CalendarCheck, CalendarDays, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const ci = checkIn ? checkIn.toISOString().slice(0, 10) : "";
    const co = checkOut ? checkOut.toISOString().slice(0, 10) : "";
    const params = new URLSearchParams({ checkIn: ci, checkOut: co, guests });
    router.push(`/rooms/${roomSlug}?${params}`);
  }

  if (!compact) {
    return (
      <form id="booking" onSubmit={submit}>
        <div className="rounded-xl border border-neutral-200 bg-white/90 p-4 shadow-xs backdrop-blur-sm sm:p-5">
          {/* Desktop: three-column grid */}
          <div className="hidden items-start gap-5 lg:grid lg:grid-cols-[1.2fr_1.2fr_0.7fr]">
            {/* Column 1: Room & Guests */}
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <BedDouble className="size-3.5" />
                Room &amp; guests
              </p>
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(110px,0.8fr)] gap-3">
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
                <Input
                  id="search-guests"
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={guests}
                  onChange={(event) => setGuests(event.target.value)}
                  className="h-12 bg-white"
                  placeholder="Guests"
                />
              </div>
            </div>

            {/* Column 2: Your Stay */}
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <CalendarDays className="size-3.5" />
                Your stay
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                  <PopoverTrigger
                    id="search-check-in"
                    className={cn(
                      "flex h-12 w-full items-center rounded-lg border border-neutral-200 bg-white px-3.5 text-sm shadow-xs transition-colors",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                      checkIn ? "text-neutral-800" : "text-neutral-400"
                    )}
                  >
                    <CalendarDays className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    {checkIn ? format(checkIn, "d MMM yyyy") : "Check-in"}
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-2" align="start">
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
                <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                  <PopoverTrigger
                    id="search-check-out"
                    className={cn(
                      "flex h-12 w-full items-center rounded-lg border border-neutral-200 bg-white px-3.5 text-sm shadow-xs transition-colors",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                      checkOut ? "text-neutral-800" : "text-neutral-400"
                    )}
                  >
                    <CalendarDays className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    {checkOut ? format(checkOut, "d MMM yyyy") : "Check-out"}
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-2" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={(date) => {
                        setCheckOut(date);
                        setCheckOutOpen(false);
                      }}
                      fromDate={checkIn || today}
                      disabled={{ before: checkIn || today }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Column 3: Availability */}
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <CalendarCheck className="size-3.5" />
                Availability
              </p>
              <Button type="submit" size="lg" className="h-12 w-full" disabled={!roomSlug}>
                <Search className="mr-2 size-4" />
                Check dates
              </Button>
            </div>
          </div>

          {/* Tablet: two-column grid with CTA below */}
          <div className="hidden items-start gap-5 sm:grid lg:hidden sm:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <BedDouble className="size-3.5" />
                Room &amp; guests
              </p>
              <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
                <SelectTrigger id="search-room-tablet" className="h-12 w-full bg-white">
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
              <Input
                id="search-guests-tablet"
                type="number"
                min="1"
                max="30"
                required
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="h-12 bg-white"
                placeholder="Number of guests"
              />
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <CalendarDays className="size-3.5" />
                Your stay
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                  <PopoverTrigger
                    id="search-check-in-t"
                    className={cn(
                      "flex h-12 w-full items-center rounded-lg border border-neutral-200 bg-white px-3 text-sm shadow-xs transition-colors",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                      checkIn ? "text-neutral-800" : "text-neutral-400"
                    )}
                  >
                    <CalendarDays className="mr-1.5 size-4 shrink-0 text-muted-foreground" />
                    {checkIn ? format(checkIn, "d MMM") : "Check-in"}
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-2" align="start">
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
                <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                  <PopoverTrigger
                    id="search-check-out-t"
                    className={cn(
                      "flex h-12 w-full items-center rounded-lg border border-neutral-200 bg-white px-3 text-sm shadow-xs transition-colors",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                      checkOut ? "text-neutral-800" : "text-neutral-400"
                    )}
                  >
                    <CalendarDays className="mr-1.5 size-4 shrink-0 text-muted-foreground" />
                    {checkOut ? format(checkOut, "d MMM") : "Check-out"}
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-2" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={(date) => {
                        setCheckOut(date);
                        setCheckOutOpen(false);
                      }}
                      fromDate={checkIn || today}
                      disabled={{ before: checkIn || today }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="h-12 w-full" disabled={!roomSlug}>
                <Search className="mr-2 size-4" />
                Check dates
              </Button>
            </div>
          </div>

          {/* Mobile: single column stacked */}
          <div className="flex flex-col gap-4 sm:hidden">
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <BedDouble className="size-3.5" />
                Room
              </p>
              <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
                <SelectTrigger id="search-room-mobile" className="h-12 w-full bg-white">
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
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <Users className="size-3.5" />
                Guests
              </p>
              <Input
                id="search-guests-mobile"
                type="number"
                min="1"
                max="30"
                required
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="h-12 bg-white"
                placeholder="Number of guests"
              />
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <CalendarDays className="size-3.5" />
                Your stay
              </p>
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger
                  id="search-check-in-m"
                  className={cn(
                    "flex h-12 w-full items-center rounded-lg border border-neutral-200 bg-white px-3.5 text-sm shadow-xs transition-colors",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                    checkIn ? "text-neutral-800" : "text-neutral-400"
                  )}
                >
                  <CalendarDays className="mr-2 size-4 shrink-0 text-muted-foreground" />
                  {checkIn ? format(checkIn, "d MMM yyyy") : "Check-in"}
                </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-2" align="start">
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
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger
                  id="search-check-out-m"
                  className={cn(
                    "flex h-12 w-full items-center rounded-lg border border-neutral-200 bg-white px-3.5 text-sm shadow-xs transition-colors",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                    checkOut ? "text-neutral-800" : "text-neutral-400"
                  )}
                >
                  <CalendarDays className="mr-2 size-4 shrink-0 text-muted-foreground" />
                  {checkOut ? format(checkOut, "d MMM yyyy") : "Check-out"}
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={(date) => {
                      setCheckOut(date);
                      setCheckOutOpen(false);
                    }}
                    fromDate={checkIn || today}
                    disabled={{ before: checkIn || today }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" size="lg" className="h-12 w-full" disabled={!roomSlug}>
              <Search className="mr-2 size-4" />
              Check dates
            </Button>
          </div>
        </div>
      </form>
    );
  }

  // Compact variant (rooms listing page)
  return (
    <form id="booking" onSubmit={submit}>
      <div className="rounded-xl border border-neutral-200 bg-white/90 p-4 shadow-xs backdrop-blur-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.55fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="search-room-compact">Room</Label>
            <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
              <SelectTrigger id="search-room-compact" className="h-12 w-full bg-background">
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
              <PopoverTrigger
                id="search-check-in-c"
                className={cn(
                  "flex h-12 w-full items-center rounded-md border border-neutral-200 bg-background px-3 text-sm shadow-xs transition-colors",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                  checkIn ? "text-neutral-800" : "text-neutral-400"
                )}
              >
                {checkIn ? format(checkIn, "d MMM") : "Check-in"}
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-2" align="start">
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
              <PopoverTrigger
                id="search-check-out-c"
                className={cn(
                  "flex h-12 w-full items-center rounded-md border border-neutral-200 bg-background px-3 text-sm shadow-xs transition-colors",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                  checkOut ? "text-neutral-800" : "text-neutral-400"
                )}
              >
                {checkOut ? format(checkOut, "d MMM") : "Check-out"}
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
              className="h-12 bg-background"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 self-end" disabled={!roomSlug}>
            <Search className="size-4" />
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
