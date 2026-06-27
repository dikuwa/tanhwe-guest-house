"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit3, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Block = {
  id: string;
  name: string;
  shortCode: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  roomUnitCount: number;
};

const activePill = "bg-blue-100 text-blue-800";
const inactivePill = "bg-gray-100 text-gray-600";

export function BlocksManager() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Block | null>(null);

  async function loadBlocks() {
    setLoading(true);
    const res = await fetch("/api/admin/blocks");
    if (res.ok) {
      const data = await res.json();
      setBlocks(data);
    }
    setLoading(false);
  }

  useEffect(() => { loadBlocks(); }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const shortCode = String(form.get("shortCode") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();

    if (!name) return toast.error("Block name is required");
    if (!shortCode) return toast.error("Short code is required");

    setSaving("new");
    try {
      const response = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shortCode, description: description || undefined, displayOrder: blocks.length + 1 }),
      });
      const data = await response.json();
      if (!response.ok) return toast.error(data.error ?? "Could not create block");
      toast.success(`${data.name} created`);
      setShowCreate(false);
      loadBlocks();
      router.refresh();
    } catch (e) {
      toast.error("Could not create block");
    } finally {
      setSaving(null);
    }
  }

  async function handleUpdate(id: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const shortCode = String(form.get("shortCode") ?? "").trim().toUpperCase();
    const description = String(form.get("description") ?? "").trim() || null;
    const displayOrder = Number(form.get("displayOrder"));
    const isActive = form.get("isActive") === "on";

    if (!name) return toast.error("Block name is required");
    if (!shortCode) return toast.error("Short code is required");

    setSaving(id);
    try {
      const response = await fetch(`/api/admin/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shortCode, description, displayOrder, isActive }),
      });
      const data = await response.json();
      if (!response.ok) return toast.error(data.error ?? "Could not update block");
      toast.success(`${name} updated`);
      setEditing(null);
      loadBlocks();
      router.refresh();
    } catch (e) {
      toast.error("Could not update block");
    } finally {
      setSaving(null);
    }
  }

  async function handleDeactivate(id: string, currentActive: boolean) {
    if (!currentActive) return;
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    setSaving(id);
    try {
      const response = await fetch(`/api/admin/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: block.name,
          shortCode: block.shortCode,
          description: block.description ?? "",
          displayOrder: block.displayOrder,
          isActive: false,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return toast.error(data.error ?? "Could not deactivate block");
      toast.success(`${block.name} deactivated`);
      loadBlocks();
      router.refresh();
    } catch (e) {
      toast.error("Could not deactivate block");
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    const block = deleteConfirm;
    setDeleteConfirm(null);
    setSaving(block.id);
    const response = await fetch(`/api/admin/blocks/${block.id}`, { method: "DELETE" });
    setSaving(null);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(data.error ?? "Could not delete block");
      return;
    }
    toast.success(`${block.name} deleted`);
    loadBlocks();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
          <p className="text-sm text-muted-foreground">No blocks have been added yet.</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="size-4" />
            Add block
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{blocks.length} block{blocks.length === 1 ? "" : "s"}</p>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              Add block
            </Button>
          </div>
          {blocks.map((block) => (
            <div key={block.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
              {editing === block.id ? (
                <form onSubmit={(e) => handleUpdate(block.id, e)} className="space-y-4">
                  <input type="hidden" name="displayOrder" value={block.displayOrder} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`edit-name-${block.id}`}>Block name</Label>
                      <Input id={`edit-name-${block.id}`} name="name" defaultValue={block.name} className="mt-1" required />
                    </div>
                    <div>
                      <Label htmlFor={`edit-code-${block.id}`}>Short code</Label>
                      <Input id={`edit-code-${block.id}`} name="shortCode" defaultValue={block.shortCode} className="mt-1 uppercase" required maxLength={10} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor={`edit-desc-${block.id}`}>Description (optional)</Label>
                      <Textarea id={`edit-desc-${block.id}`} name="description" defaultValue={block.description ?? ""} className="mt-1" rows={2} />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox name="isActive" defaultChecked={block.isActive} />
                        Active
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving === block.id}>
                      {saving === block.id ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
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
                      <h3 className="font-semibold text-neutral-800">{block.name}</h3>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium font-mono leading-none text-gray-600">{block.shortCode}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none ${block.isActive ? activePill : inactivePill}`}>
                        {block.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {block.roomUnitCount} room unit{block.roomUnitCount === 1 ? "" : "s"}
                    </p>
                    {block.description && (
                      <p className="mt-1 text-sm text-neutral-600">{block.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(block.id)} title="Edit">
                      <Edit3 className="size-3.5" />
                    </Button>
                    {block.isActive ? (
                      <Button variant="ghost" size="icon" className="size-8 text-neutral-400 hover:text-red-600" onClick={() => handleDeactivate(block.id, true)} title="Deactivate" disabled={saving === block.id}>
                        {saving === block.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="size-8 text-neutral-400 hover:text-red-600" onClick={() => setDeleteConfirm(block)} title="Delete" disabled={saving === block.id}>
                        {saving === block.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <Dialog open={showCreate} onOpenChange={(v) => { if (saving !== "new") setShowCreate(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New block</DialogTitle>
            <DialogDescription>Add a new accommodation block or wing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="dlg-name">Block name</Label>
              <Input id="dlg-name" name="name" className="mt-1.5" placeholder="e.g. Garden Wing" required />
            </div>
            <div>
              <Label htmlFor="dlg-code">Short code</Label>
              <Input id="dlg-code" name="shortCode" className="mt-1.5 uppercase" placeholder="e.g. GW" required maxLength={10} />
            </div>
            <div>
              <Label htmlFor="dlg-desc">Description (optional)</Label>
              <Textarea id="dlg-desc" name="description" className="mt-1.5" rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={saving === "new"}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving === "new"}>
                {saving === "new" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Create block
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title={`Delete ${deleteConfirm.name}?`}
          description={
            deleteConfirm.roomUnitCount > 0
              ? `"${deleteConfirm.name}" contains ${deleteConfirm.roomUnitCount} room unit(s). Reassign or deactivate these units before deleting.`
              : `This will permanently delete "${deleteConfirm.name}". This action cannot be undone.`
          }
          confirmLabel={deleteConfirm.roomUnitCount > 0 ? "Deactivate instead" : "Delete"}
          variant="destructive"
        />
      )}
    </div>
  );
}
