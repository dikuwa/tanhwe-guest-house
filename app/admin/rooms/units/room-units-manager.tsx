"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Loader2, Plus, Save, Trash2, X, DoorClosed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

type Block = {
  id: string;
  name: string;
  shortCode: string;
  isActive: boolean;
};

type RoomUnit = {
  id: string;
  roomId: string;
  block: string;
  blockId: string | null;
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

const recordStatusColors: Record<string, string> = {
  true: "bg-blue-100 text-blue-800",
  false: "bg-gray-100 text-gray-600",
};

const opStatusColors: Record<string, string> = {
  available: "bg-blue-100 text-blue-800",
  cleaning: "bg-yellow-100 text-yellow-800",
  maintenance: "bg-orange-100 text-orange-800",
  blocked: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-600",
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
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterBlockId, setFilterBlockId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRoomTypeId, setFilterRoomTypeId] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Inline form state
  const [newBlockId, setNewBlockId] = useState("");
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatedName, setGeneratedName] = useState("");
  const [showInlineBlockForm, setShowInlineBlockForm] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockShortCode, setNewBlockShortCode] = useState("");

  async function loadUnits() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterBlockId !== "all") {
      const block = blocks.find((b) => b.id === filterBlockId);
      if (block) params.set("block", block.shortCode);
    }
    if (filterStatus !== "all") params.set("operationalStatus", filterStatus);
    if (filterRoomTypeId !== "all") params.set("roomTypeId", filterRoomTypeId);
    const res = await fetch(`/api/admin/room-units?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUnits(data);
    }
    setLoading(false);
  }

  async function loadBlocks() {
    const res = await fetch("/api/admin/blocks");
    if (res.ok) {
      const data = await res.json();
      setBlocks(data.filter((b: Block) => b.isActive));
    }
  }

  useEffect(() => {
    loadBlocks();
  }, []);

  useEffect(() => {
    loadUnits();
  }, [filterBlockId, filterStatus, filterRoomTypeId, blocks]);

  function updatePreview(blockId: string, num: string) {
    const block = blocks.find((b) => b.id === blockId);
    if (block && num) {
      const padded = String(Number(num)).padStart(2, "0");
      setGeneratedCode(`${block.shortCode}${padded}`);
      setGeneratedName(`${block.name} – Room ${padded}`);
    } else {
      setGeneratedCode("");
      setGeneratedName("");
    }
  }

  function handleBlockChange(value: string | null, _details?: any) {
    const v = value ?? "";
    setNewBlockId(v);
    updatePreview(v, newRoomNumber);
    setShowInlineBlockForm(false);
  }

  function handleRoomNumberChange(value: string) {
    setNewRoomNumber(value);
    updatePreview(newBlockId, value);
  }

  async function handleInlineCreateBlock() {
    if (!newBlockName.trim() || !newBlockShortCode.trim()) {
      return toast.error("Block name and short code are required");
    }
    const res = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newBlockName.trim(),
        shortCode: newBlockShortCode.trim().toUpperCase(),
      }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Could not create block");
    toast.success(`${data.name} created`);
    await loadBlocks();
    setNewBlockId(data.id);
    updatePreview(data.id, newRoomNumber);
    setNewBlockName("");
    setNewBlockShortCode("");
    setShowInlineBlockForm(false);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roomId = String(form.get("roomId") ?? "");
    const blockId = String(form.get("blockId") ?? "");
    const roomNumber = Number(form.get("roomNumber"));
    const operationalStatus = String(form.get("operationalStatus") ?? "available");
    const notes = String(form.get("notes") ?? "").trim();

    if (!roomId || !blockId || !roomNumber) {
      return toast.error("Room, block and room number are required");
    }

    const block = blocks.find((b) => b.id === blockId);
    if (!block) return toast.error("Selected block not found");

    setSaving("new");
    try {
      const response = await fetch("/api/admin/room-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, blockId, roomNumber, operationalStatus, notes: notes || undefined }),
      });
      const data = await response.json();
      if (!response.ok) return toast.error(data.error ?? "Could not create room unit");
      toast.success(`${data.displayName} created`);
      setShowCreate(false);
      setNewBlockId("");
      setNewRoomNumber("");
      loadUnits();
      router.refresh();
    } catch (e) {
      toast.error("Could not create room unit");
    } finally {
      setSaving(null);
    }
  }

  async function handleUpdate(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      blockId: String(form.get("blockId")),
      roomNumber: Number(form.get("roomNumber")),
      roomId: String(form.get("roomId")),
      operationalStatus: String(form.get("operationalStatus")),
      isActive: form.get("isActive") === "on",
      notes: String(form.get("notes") ?? "").trim() || null,
    };

    setSaving(id);
    try {
      const response = await fetch(`/api/admin/room-units/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) return toast.error(data.error ?? "Could not update room unit");
      toast.success("Room unit updated");
      setEditing(null);
      loadUnits();
      router.refresh();
    } catch (e) {
      toast.error("Could not update room unit");
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setDeleteConfirm(null);
    setSaving(id);
    try {
      const response = await fetch(`/api/admin/room-units/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return void toast.error(data.error ?? "Could not delete room unit");
      toast.success("Room unit deleted");
      loadUnits();
      router.refresh();
    } catch (e) {
      toast.error("Could not delete room unit");
    } finally {
      setSaving(null);
    }
  }

  const filteredUnits = units;

  return (
    <div className="space-y-4">
      {/* Filters + Add button row */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="min-w-36 flex-1">
          <Label className="text-xs text-muted-foreground">Block</Label>
          <Select value={filterBlockId} onValueChange={(v) => v && setFilterBlockId(v)}>
            <SelectTrigger className="mt-1 h-10 w-full">
              <SelectValue placeholder="All blocks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All blocks</SelectItem>
              {blocks.filter((b) => b.isActive).map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-36 flex-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
            <SelectTrigger className="mt-1 h-10 w-full">
              <SelectValue placeholder="All statuses" />
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
        <div className="min-w-44 flex-1">
          <Label className="text-xs text-muted-foreground">Room type</Label>
          <Select value={filterRoomTypeId} onValueChange={(v) => v && setFilterRoomTypeId(v)}>
            <SelectTrigger className="mt-1 h-10 w-full">
              <SelectValue placeholder="All room types" />
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
        {!showCreate && (
          <Button className="h-10 shrink-0" onClick={() => setShowCreate(true)}>
            <Plus className="size-4" />
            Add room unit
          </Button>
        )}
      </div>

      {/* Units list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUnits.length === 0 && !showCreate ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
          <p className="text-sm text-muted-foreground">No room units found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUnits.map((unit) => {
            const block = blocks.find((b) => b.id === unit.blockId);
            return (
              <div
                key={unit.id}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 transition-colors hover:border-neutral-300"
              >
                {editing === unit.id ? (
                  <form onSubmit={(e) => handleUpdate(unit.id, e)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor={`edit-room-${unit.id}`}>Room</Label>
                        <Select name="roomId" defaultValue={unit.roomId}>
                          <SelectTrigger id={`edit-room-${unit.id}`} className="mt-1 h-10 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.filter((r) => r.status !== "archived").map((r) => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`edit-block-${unit.id}`}>Block</Label>
                        <Select name="blockId" defaultValue={unit.blockId ?? unit.block}>
                          <SelectTrigger id={`edit-block-${unit.id}`} className="mt-1 h-10 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {blocks.filter((b) => b.isActive).map((b) => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
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
                          className="mt-1 h-10 w-full"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-status-${unit.id}`}>Status</Label>
                        <Select name="operationalStatus" defaultValue={unit.operationalStatus}>
                          <SelectTrigger id={`edit-status-${unit.id}`} className="mt-1 h-10 w-full">
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
                          <Checkbox name="isActive" defaultChecked={unit.isActive} />
                          Active
                        </label>
                      </div>
                      <div className="lg:col-span-3">
                        <Label htmlFor={`edit-notes-${unit.id}`}>Notes</Label>
                        <Textarea
                          id={`edit-notes-${unit.id}`}
                          name="notes"
                          defaultValue={unit.notes ?? ""}
                          className="mt-1 w-full"
                          rows={1}
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
                  <div className="flex items-center gap-3">
                    {/* Column 1: Icon */}
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                      <DoorClosed className="size-4 text-neutral-400" />
                    </div>

                    {/* Column 2: Display name */}
                    <div className="min-w-0 flex-[2]">
                      <span className="block truncate text-sm font-medium text-neutral-800">
                        {unit.displayName}
                      </span>
                    </div>

                    {/* Column 3: Room code */}
                    <div className="hidden w-20 shrink-0 md:block">
                      <span className="font-mono text-xs text-neutral-400">{unit.roomCode}</span>
                    </div>

                    {/* Column 4: Status pills */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none ${recordStatusColors[String(unit.isActive)]}`}
                      >
                        {unit.isActive ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize leading-none ${opStatusColors[unit.operationalStatus] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {unit.operationalStatus}
                      </span>
                    </div>

                    {/* Column 5: Actions */}
                    <div className="flex shrink-0 items-center gap-0.5 pl-1">
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                        onClick={() => setEditing(unit.id)}
                        title="Edit room unit"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteConfirm(unit.id)}
                        title="Delete room unit"
                        disabled={saving === unit.id}
                      >
                        {saving === unit.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => { if (saving !== "new") { if (!v) { setNewBlockId(""); setNewRoomNumber(""); setGeneratedCode(""); setGeneratedName(""); } setShowCreate(v); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New room unit</DialogTitle>
            <DialogDescription>Add a new room unit to the inventory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="dlg-room">Room</Label>
                <Select name="roomId" defaultValue="">
                  <SelectTrigger id="dlg-room" className="mt-1.5 h-10 w-full">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.filter((r) => r.status !== "archived").map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dlg-block">Block</Label>
                <Select value={newBlockId} onValueChange={handleBlockChange}>
                  <SelectTrigger id="dlg-block" className="mt-1.5 h-10 w-full">
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.filter((b) => b.isActive).map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="blockId" value={newBlockId} />
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                  onClick={() => setShowInlineBlockForm(!showInlineBlockForm)}
                >
                  {showInlineBlockForm ? "Cancel" : "+ Add new block"}
                </button>
                {showInlineBlockForm && (
                  <div className="mt-2 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <Input
                      placeholder="Block name"
                      value={newBlockName}
                      onChange={(e) => setNewBlockName(e.target.value)}
                      className="h-9 w-full text-sm"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Short code"
                        value={newBlockShortCode}
                        onChange={(e) => setNewBlockShortCode(e.target.value)}
                        className="h-9 flex-1 text-sm uppercase"
                        maxLength={10}
                      />
                      <Button type="button" size="sm" className="h-9 shrink-0" onClick={handleInlineCreateBlock}>
                        <Plus className="size-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="dlg-number">Room number</Label>
                <Input
                  id="dlg-number"
                  name="roomNumber"
                  type="number"
                  min="1"
                  max="99"
                  placeholder="e.g. 03"
                  className="mt-1.5 h-10 w-full"
                  value={newRoomNumber}
                  onChange={(e) => handleRoomNumberChange(e.target.value)}
                  required
                />
              </div>
            </div>
            {generatedCode && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-neutral-500">Code: <strong className="text-neutral-800">{generatedCode}</strong></span>
                  <span className="text-neutral-300">|</span>
                  <span className="text-neutral-500">Name: <strong className="text-neutral-800">{generatedName}</strong></span>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Status</Label>
                <Select name="operationalStatus" defaultValue="available">
                  <SelectTrigger className="mt-1.5 h-10 w-full">
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
              <div>
                <Label htmlFor="dlg-notes">Notes (optional)</Label>
                <Textarea id="dlg-notes" name="notes" className="mt-1.5 w-full" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setNewBlockId(""); setNewRoomNumber(""); setGeneratedCode(""); setGeneratedName(""); }} disabled={saving === "new"}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving === "new" || !newBlockId}>
                {saving === "new" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Create room unit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
