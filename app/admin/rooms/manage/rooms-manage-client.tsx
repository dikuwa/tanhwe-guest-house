"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RoomTypesManager } from "@/app/admin/rooms/types/room-types-manager";
import { RoomUnitsManager } from "@/app/admin/rooms/units/room-units-manager";
import { BlocksManager } from "@/app/admin/rooms/blocks/blocks-manager";

const tabs = [
  { id: "types", label: "Room types" },
  { id: "units", label: "Room units" },
  { id: "blocks", label: "Blocks" },
] as const;

export function RoomsManageClient({
  initialRoomTypes,
  rooms,
  activeRoomTypes,
  initialBlocks,
}: {
  initialRoomTypes: any[];
  rooms: any[];
  activeRoomTypes: any[];
  initialBlocks: any[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") ?? "types";

  function setTab(id: string) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", id);
    router.replace(`/admin/rooms/manage?${params.toString()}`, { scroll: false });
  }

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
        {tab === "types" && <RoomTypesManager initial={initialRoomTypes} />}
        {tab === "units" && <RoomUnitsManager rooms={rooms} roomTypes={activeRoomTypes} />}
        {tab === "blocks" && <BlocksManager />}
      </div>
    </div>
  );
}
