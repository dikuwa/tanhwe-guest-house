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
import { BedDouble, CalendarCheck, CalendarDays, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
  const [submitting, setSubmitting] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!checkIn) {
      toast.error("Missing check-in date", { description: "Please select your check-in date." });
      return;
    }
    if (!checkOut) {
      toast.error("Missing check-out date", { description: "Please select your check-out date." });
      return;
    }
    if (checkOut <= checkIn) {
      toast.error("Invalid date range", { description: "Check-out must be after check-in." });
      return;
    }
    setSubmitting(true);
    const ci = checkIn.toISOString().slice(0, 10);
    const co = checkOut.toISOString().slice(0, 10);
    const params = new URLSearchParams({ checkIn: ci, checkOut: co, guests });
    router.push(`/rooms/${roomSlug}?${params}`);
  }

  const triggerClass = cn(
    "flex h-11 w-full items-center rounded-lg border border-neutral-200 bg-white px-3.5 text-sm shadow-sm transition-colors",
    "hover:border-neutral-300 hover:bg-neutral-50",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
  );

  if (!compact) {
    return (
      <form id="booking" onSubmit={submit}>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          {/* 
            Single responsive grid — controls are rendered once and rearranged at each breakpoint.
            Mobile:   1 column (fully stacked)
            Tablet:   2 columns (Room & Guests stacked left, Your Stay right), CTA spans full width
            Desktop:  3 columns (Room & Guests | Your Stay | CTA)
          */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1.1fr)_minmax(280px,1.1fr)_minmax(180px,0.8fr)] lg:gap-6">
            {/* ===== Column 1: Room & Guests ===== */}
            <div className="flex flex-col">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <BedDouble className="size-4" />
                Room &amp; Guests
              </p>
              {/* Stacked on mobile (<sm), side-by-side on sm+ */}
              <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(100px,0.8fr)]">
                <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
                  <SelectTrigger id="search-room" className="h-11 bg-white">
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
                   className="h-11 bg-white"
                   placeholder="Guests"
                  title="Number of guests"
                />
              </div>
            </div>

            {/* ===== Column 2: Your Stay (single Popover instances) ===== */}
            <div className="flex flex-col">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <CalendarDays className="size-4" />
                Your Stay
              </p>
              {/* Stacked on mobile, side-by-side on sm+ */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Check-in — rendered once */}
                <Popover
                  open={checkInOpen}
                  onOpenChange={(nextOpen) => {
                    if (nextOpen) setCheckOutOpen(false);
                    setCheckInOpen(nextOpen);
                  }}
                >
                  <PopoverTrigger
                    id="search-check-in"
                    className={cn(triggerClass, checkIn ? "text-neutral-800 font-medium" : "text-neutral-500")}
                  >
                    <CalendarDays className="mr-2 size-4 shrink-0 text-neutral-400" />
                    <span>{checkIn ? format(checkIn, "d MMM") : "Check-in"}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
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
                        setCheckInOpen(false);
                        if (!checkOut) setCheckOutOpen(true);
                      }}
                      fromDate={today}
                      disabled={{ before: today }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Check-out — rendered once */}
                <Popover
                  open={checkOutOpen}
                  onOpenChange={(nextOpen) => {
                    if (nextOpen) setCheckInOpen(false);
                    setCheckOutOpen(nextOpen);
                  }}
                >
                  <PopoverTrigger
                    id="search-check-out"
                    className={cn(triggerClass, checkOut ? "text-neutral-800 font-medium" : "text-neutral-500")}
                  >
                    <CalendarDays className="mr-2 size-4 shrink-0 text-neutral-400" />
                    <span>{checkOut ? format(checkOut, "d MMM") : "Check-out"}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
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

            {/* ===== Column 3: Check Dates CTA ===== */}
            <div className="flex flex-col sm:col-span-2 lg:col-span-1">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <CalendarCheck className="size-4" />
                Check Dates
              </p>
              <Button
                type="submit"
                className="h-11 w-full bg-orange-500 text-white hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/30"
                disabled={!roomSlug || submitting}
              >
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
                {submitting ? "Checking availability\u2026" : "Check Availability"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    );
  }

  // ===== Compact variant (rooms listing page) =====
  return (
    <form id="booking" onSubmit={submit}>
      <div className="rounded-xl border border-neutral-200 bg-white/90 p-4 shadow-xs backdrop-blur-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.55fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="search-room-compact">Room</Label>
            <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
              <SelectTrigger id="search-room-compact" className="w-full bg-background">
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
                  "flex h-11 w-full items-center rounded-lg border border-neutral-200 bg-background px-3 text-sm shadow-xs transition-colors",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
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
                  "flex h-11 w-full items-center rounded-lg border border-neutral-200 bg-background px-3 text-sm shadow-xs transition-colors",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
                  checkOut ? "text-neutral-800" : "text-neutral-400"
                )}
              >
                {checkOut ? format(checkOut, "d MMM") : "Check-out"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={(date) => {
                    setCheckOut(date);
                  }}
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
              className="bg-background"
            />
          </div>
          <Button type="submit" size="lg" className="self-end" disabled={!roomSlug || submitting}>
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
            {submitting ? "Checking availability\u2026" : "Check Availability"}
          </Button>
        </div>
      </div>
    </form>
  );
}
