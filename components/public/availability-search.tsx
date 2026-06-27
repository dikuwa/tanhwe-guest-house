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
import { BedDouble, CalendarCheck, CalendarDays, Loader2, Search, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type RoomOption = { slug: string; name: string };

type AvailabilityFormProps = {
  rooms: RoomOption[];
  context?: "home" | "rooms";
};

export function AvailabilityForm({ rooms, context = "home" }: AvailabilityFormProps) {
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
    "flex h-11 w-full items-center rounded-lg border border-neutral-200 bg-background px-3.5 text-sm shadow-sm transition-colors",
    "hover:border-neutral-300 hover:bg-neutral-50",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
  );

  const cardClass =
    context === "home"
      ? "rounded-xl border bg-card p-5 shadow-[0_18px_55px_-42px_rgba(17,24,39,.45)] sm:p-6"
      : "rounded-xl border bg-card p-5";

  return (
    <form id="booking" onSubmit={submit} className={cardClass}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.55fr_1fr_1fr_auto] lg:gap-5">
        {/* Room type */}
        <div className="space-y-1.5">
          <Label htmlFor="search-room" className="flex items-center gap-1.5 text-sm font-medium">
            <BedDouble className="size-4 text-muted-foreground" aria-hidden="true" />
            Room type
          </Label>
          <Select value={roomSlug} onValueChange={(value) => value && setRoomSlug(value)}>
            <SelectTrigger id="search-room" className="h-11 w-full bg-background">
              <SelectValue placeholder="Select a room type" />
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

        {/* Guests */}
        <div className="space-y-1.5">
          <Label htmlFor="search-guests" className="flex items-center gap-1.5 text-sm font-medium">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            Guests
          </Label>
          <Input
            id="search-guests"
            type="number"
            min="1"
            max="30"
            required
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            className="h-11 bg-background"
          />
        </div>

        {/* From */}
        <div className="space-y-1.5">
          <Label htmlFor="search-from" className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
            From
          </Label>
          <Popover
            open={checkInOpen}
            onOpenChange={(nextOpen) => {
              if (nextOpen) setCheckOutOpen(false);
              setCheckInOpen(nextOpen);
            }}
          >
            <PopoverTrigger
              id="search-from"
              className={cn(
                triggerClass,
                checkIn ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {checkIn ? format(checkIn, "d MMM") : "Select date"}
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
        </div>

        {/* To */}
        <div className="space-y-1.5">
          <Label htmlFor="search-to" className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            To
          </Label>
          <Popover
            open={checkOutOpen}
            onOpenChange={(nextOpen) => {
              if (nextOpen) setCheckInOpen(false);
              setCheckOutOpen(nextOpen);
            }}
          >
            <PopoverTrigger
              id="search-to"
              className={cn(
                triggerClass,
                checkOut ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {checkOut ? format(checkOut, "d MMM") : "Select date"}
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

        {/* Availability */}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label
            htmlFor="search-availability"
            className="flex items-center gap-1.5 text-sm font-medium"
          >
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            Availability
          </Label>
          <Button
            id="search-availability"
            type="submit"
            className="w-full"
            disabled={!roomSlug || submitting}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Search className="mr-2 size-4" />
            )}
            {submitting ? "Checking availability\u2026" : "Check Availability"}
          </Button>
        </div>
      </div>
      <div className="mt-3 text-right">
        <Link
          href="/rooms"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          View room types and amenities
        </Link>
      </div>
    </form>
  );
}

/** @deprecated Use `AvailabilityForm` with `context` prop instead */
export const AvailabilitySearch = AvailabilityForm;
