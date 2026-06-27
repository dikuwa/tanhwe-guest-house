import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminRooms, getActiveRoomTypes, getAdminRoomTypes, getAdminBlocks } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { RoomsManageClient } from "./rooms-manage-client";

export default async function RoomsManagePage() {
  await requireRole(["owner", "admin"]);
  const [roomTypes, rooms, activeRoomTypes, blocks] = await Promise.all([
    getAdminRoomTypes(),
    getAdminRooms(),
    getActiveRoomTypes(),
    getAdminBlocks(),
  ]);
  return (
    <div className="mx-auto max-w-6xl">
      <Button variant="ghost" size="sm" render={<Link href="/admin/rooms" />}>
        <ArrowLeft className="size-4" />
        All rooms
      </Button>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">Inventory</p>
      <h1 className="font-heading text-2xl font-bold text-neutral-800">Room inventory</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage room categories, physical room units and accommodation blocks.
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
          <RoomsManageClient
            initialRoomTypes={roomTypes}
            rooms={rooms}
            activeRoomTypes={activeRoomTypes}
            initialBlocks={blocks}
          />
        </Suspense>
      </div>
    </div>
  );
}
