"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Room = {
  id: string;
  name: string;
  slug: string;
  status: string;
  roomTypeId: string | null;
};

type RoomType = {
  id: string;
  name: string;
};

type RoomUnit = {
  id: string;
  roomId: string;
  block: string;
  roomNumber: number;
  roomCode: string;
  displayName: string;
  operationalStatus: string;
  isActive: boolean;
  notes: string | null;
  roomName: string;
  roomSlug: string;
  roomStatus: string;
};

const statusBadge: Record<string, "secondary" | "outline" | "destructive" | "default"> = {
  available: "secondary",
  cleaning: "outline",
  maintenance: "destructive",
  blocked: "destructive",
  inactive: "outline",
};

export function RoomUnitsManager({
  rooms,
  roomTypes,
}: {
  rooms: Room[];
  roomTypes: RoomType[];
}) {
  const router = useRouter();
  const [units, setUnits] = useState<RoomUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterBlock, setFilterBlock] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRoomTypeId, setFilterRoomTypeId] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function loadUnits() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterBlock !== "all") params.set("block", filterBlock);
    if (filterStatus !== "all") params.set("operationalStatus", filterStatus);
    if (filterRoomTypeId !== "all") params.set("roomTypeId", filterRoomTypeId);
    const res = await fetch(`/api/admin/room-units?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUnits(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUnits();
  }, [filterBlock, filterStatus, filterRoomTypeId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roomId = String(form.get("roomId") ?? "");
    const block = String(form.get("block") ?? "");
    const roomNumber = Number(form.get("roomNumber"));
    const operationalStatus = String(form.get("operationalStatus") ?? "available");
    const notes = String(form.get("notes") ?? "").trim();

    if (!roomId || !block || !roomNumber) {
      return toast.error("Room, block and room number are required");
    }

    const displayName = `Block ${block} – Room ${String(roomNumber).padStart(2, "0")}`;

    setSaving("new");
    const response = await fetch("/api/admin/room-units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, block, roomNumber, displayName, operationalStatus, notes: notes || undefined }),
    });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) return toast.error(data.error ?? "Could not create room unit");
    toast.success(`${data.displayName} created`);
    setShowCreate(false);
    loadUnits();
    router.refresh();
  }

  async function handleUpdate(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      block: String(form.get("block")),
      roomNumber: Number(form.get("roomNumber")),
      roomId: String(form.get("roomId")),
      operationalStatus: String(form.get("operationalStatus")),
      isActive: form.get("isActive") === "on",
      notes: String(form.get("notes") ?? "").trim() || null,
    };

    setSaving(id);
    const response = await fetch(`/api/admin/room-units/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) return toast.error(data.error ?? "Could not update room unit");
    toast.success("Room unit updated");
    setEditing(null);
    loadUnits();
    router.refresh();
  }

  async function handleDelete(id: string): Promise<void> {
    setDeleteConfirm(null);
    setSaving(id);
    const response = await fetch(`/api/admin/room-units/${id}`, { method: "DELETE" });
    setSaving(null);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(data.error ?? "Could not delete room unit");
      return;
    }
    toast.success("Room unit deleted");
    loadUnits();
    router.refresh();
  }

  const filteredUnits = units;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="min-w-32 flex-1">
          <Label className="text-xs text-muted-foreground">Block</Label>
          <Select value={filterBlock} onValueChange={(v) => v && setFilterBlock(v)}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All blocks</SelectItem>
              <SelectItem value="A">Block A</SelectItem>
              <SelectItem value="B">Block B</SelectItem>
              <SelectItem value="C">Block C</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-32 flex-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-40 flex-1">
          <Label className="text-xs text-muted-foreground">Room type</Label>
          <Select value={filterRoomTypeId} onValueChange={(v) => v && setFilterRoomTypeId(v)}>
            <SelectTrigger className="mt-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All room types</SelectItem>
              {roomTypes.map((rt) => (
                <SelectItem key={rt.id} value={rt.id}>
                  {rt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Units list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUnits.length === 0 && !showCreate ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
          <p className="text-sm text-muted-foreground">No room units found.</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="size-4" />
            Add room unit
          </Button>
        </div>
      ) : (
        filteredUnits.map((unit) => (
          <div
            key={unit.id}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6"
          >
            {editing === unit.id ? (
              <form onSubmit={(e) => handleUpdate(unit.id, e)} className="space-y-4">
                <input type="hidden" name="isActive" value={unit.isActive ? "on" : "off"} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`edit-room-${unit.id}`}>Room</Label>
                    <Select name="roomId" defaultValue={unit.roomId}>
                      <SelectTrigger id={`edit-room-${unit.id}`} className="mt-1 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.filter((r) => r.status !== "archived").map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`edit-block-${unit.id}`}>Block</Label>
                    <Select name="block" defaultValue={unit.block}>
                      <SelectTrigger id={`edit-block-${unit.id}`} className="mt-1 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Block A</SelectItem>
                        <SelectItem value="B">Block B</SelectItem>
                        <SelectItem value="C">Block C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`edit-number-${unit.id}`}>Room number</Label>
                    <Input
                      id={`edit-number-${unit.id}`}
                      name="roomNumber"
                      type="number"
                      min="1"
                      max="99"
                      defaultValue={unit.roomNumber}
                      className="mt-1 h-10"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-status-${unit.id}`}>Operational status</Label>
                    <Select name="operationalStatus" defaultValue={unit.operationalStatus}>
                      <SelectTrigger id={`edit-status-${unit.id}`} className="mt-1 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={unit.isActive}
                        className="size-4 rounded border-neutral-300"
                      />
                      Active
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor={`edit-notes-${unit.id}`}>Notes</Label>
                    <Textarea
                      id={`edit-notes-${unit.id}`}
                      name="notes"
                      defaultValue={unit.notes ?? ""}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving === unit.id}>
                    {saving === unit.id ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                    <X className="size-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-neutral-800">{unit.displayName}</h3>
                    <Badge variant={unit.isActive ? "secondary" : "outline"} className="text-[10px]">
                      {unit.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Code: {unit.roomCode} &middot; {unit.roomName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadge[unit.operationalStatus] ?? "outline"} className="text-[10px] capitalize">
                      {unit.operationalStatus}
                    </Badge>
                    {unit.notes && (
                      <span className="text-xs text-neutral-400">{unit.notes}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setEditing(unit.id)}
                    title="Edit"
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => setDeleteConfirm(unit.id)}
                    title="Delete"
                    disabled={saving === unit.id}
                  >
                    {saving === unit.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-dashed border-primary/40 bg-primary/[0.02] p-5 shadow-xs sm:p-6"
        >
          <h3 className="font-semibold text-neutral-800">New room unit</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-room">Room</Label>
              <Select name="roomId" defaultValue="">
                <SelectTrigger id="new-room" className="mt-1 h-10">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.filter((r) => r.status !== "archived").map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-block">Block</Label>
              <Select name="block" defaultValue="">
                <SelectTrigger id="new-block" className="mt-1 h-10">
                  <SelectValue placeholder="Select block" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Block A</SelectItem>
                  <SelectItem value="B">Block B</SelectItem>
                  <SelectItem value="C">Block C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-number">Room number</Label>
              <Input
                id="new-number"
                name="roomNumber"
                type="number"
                min="1"
                max="99"
                placeholder="e.g. 01"
                className="mt-1 h-10"
                required
              />
            </div>
            <div>
              <Label htmlFor="new-status">Operational status</Label>
              <Select name="operationalStatus" defaultValue="available">
                <SelectTrigger id="new-status" className="mt-1 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="new-notes">Notes (optional)</Label>
              <Textarea id="new-notes" name="notes" className="mt-1" rows={2} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving === "new"}>
              {saving === "new" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create room unit
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!showCreate && filteredUnits.length > 0 && (
        <Button variant="outline" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          Add room unit
        </Button>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
          onConfirm={async () => handleDelete(deleteConfirm)}
          title="Delete room unit?"
          description={`This will permanently delete ${units.find((u) => u.id === deleteConfirm)?.displayName ?? "this unit"}. This action cannot be undone. Only unused units can be deleted.`}
          confirmLabel="Delete"
          variant="destructive"
        />
      )}
    </div>
  );
}
