"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RoomTypesManager } from "@/app/admin/rooms/types/room-types-manager";
import { RoomUnitsManager } from "@/app/admin/rooms/units/room-units-manager";

const tabs = [
  { id: "types", label: "Room types" },
  { id: "units", label: "Room units" },
] as const;

export function RoomsManageClient({
  initialRoomTypes,
  rooms,
  activeRoomTypes,
}: {
  initialRoomTypes: any[];
  rooms: any[];
  activeRoomTypes: any[];
}) {
  const [tab, setTab] = useState<"types" | "units">("types");

  return (
    <div>
      <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-xs w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "types" ? (
          <RoomTypesManager initial={initialRoomTypes} />
        ) : (
          <RoomUnitsManager rooms={rooms} roomTypes={activeRoomTypes} />
        )}
      </div>
    </div>
  );
}
