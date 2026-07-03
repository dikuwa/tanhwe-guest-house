"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Loader2, Plus, Save, Trash2, EyeOff, Star, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Testimonial = {
  id: string;
  guestName: string;
  guestType: string;
  guestImage: string | null;
  text: string;
  sortOrder: number;
  featured: boolean;
  active: boolean;
};

export function TestimonialManager({ initial }: { initial: Testimonial[] }) {
  const [items, setItems] = useState<Testimonial[]>(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<Testimonial | null>(null);

  async function save(t: { id?: string; guestName: string; guestType: string; guestImage?: string; text: string; sortOrder: number; featured: boolean; active: boolean; }) {
    setSaving(t.id ?? "new");
    setError("");
    const method = t.id ? "PATCH" : "POST";
    const response = await fetch("/api/admin/testimonials", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
    setSaving(null);
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Could not save testimonial");
      return;
    }
    const data = await response.json();
    setEditing(null);
    if (t.id) {
      setItems((prev) => prev.map((item) => item.id === t.id ? { ...item, guestName: t.guestName, guestType: t.guestType, guestImage: t.guestImage ?? null, text: t.text, sortOrder: t.sortOrder, featured: t.featured, active: t.active } : item));
    } else {
      setCreateOpen(false);
      setCreateDraft(null);
      setItems((prev) => [
        ...prev,
        {
          id: data.id,
          guestName: t.guestName,
          guestType: t.guestType,
          guestImage: t.guestImage ?? null,
          text: t.text,
          sortOrder: t.sortOrder,
          featured: t.featured,
          active: t.active,
        },
      ]);
    }
  }

  async function remove(id: string) {
    setSaving(id);
    await fetch("/api/admin/testimonials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSaving(null);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addNew() {
    const newItem: Testimonial = {
      id: `new-${Date.now()}`,
      guestName: "",
      guestType: "",
      guestImage: null,
      text: "",
      sortOrder: items.length + 1,
      featured: false,
      active: true,
    };
    setCreateDraft(newItem);
    setCreateOpen(true);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Social Proof</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">Testimonials</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Guest reviews displayed on the public website.
          </p>
        </div>
        <Button onClick={addNew}>
          <Plus className="size-4" />
          Add testimonial
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateDraft(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add testimonial</DialogTitle>
          </DialogHeader>
          {createDraft && (
            <TestimonialRow
              testimonial={createDraft}
              isEditing
              saving={saving === "new"}
              onEdit={() => {}}
              onSave={(data) => save(data)}
              onDelete={() => {}}
              onCancel={() => {
                setCreateOpen(false);
                setCreateDraft(null);
              }}
              deleteConfirmOpen={false}
              onDeleteConfirmClose={() => {}}
              onDeleteConfirmed={async () => {}}
              framed={false}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {items.map((t) => (
          <TestimonialRow
            key={t.id}
            testimonial={t}
            isEditing={editing === t.id}
            saving={saving === t.id || saving === "new"}
            onEdit={() => setEditing(t.id)}
            onSave={(data) => save(data)}
            onDelete={() => setDeleteId(t.id)}
            onCancel={() => {
              if (t.id.startsWith("new-")) {
                setItems((prev) => prev.filter((item) => item.id !== t.id));
              }
              setEditing(null);
            }}
            deleteConfirmOpen={deleteId === t.id}
            onDeleteConfirmClose={() => setDeleteId(null)}
            onDeleteConfirmed={async () => {
              await remove(t.id);
              setDeleteId(null);
            }}
            framed
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-neutral-500">
            No testimonials yet. Click &ldquo;Add testimonial&rdquo; to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function TestimonialRow({
  testimonial: t,
  isEditing,
  saving,
  onEdit,
  onSave,
  onDelete,
  onCancel,
  deleteConfirmOpen,
  onDeleteConfirmClose,
  onDeleteConfirmed,
  framed = true,
}: {
  testimonial: Testimonial;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: (data: { id?: string; guestName: string; guestType: string; guestImage?: string; text: string; sortOrder: number; featured: boolean; active: boolean; }) => void;
  onDelete: () => void;
  onCancel: () => void;
  deleteConfirmOpen: boolean;
  onDeleteConfirmClose: (v: boolean) => void;
  onDeleteConfirmed: () => Promise<void>;
  framed?: boolean;
}) {
  const [guestName, setGuestName] = useState(t.guestName);
  const [guestType, setGuestType] = useState(t.guestType);
  const [guestImage, setGuestImage] = useState(t.guestImage ?? "");
  const [text, setText] = useState(t.text);
  const [sortOrder, setSortOrder] = useState(t.sortOrder);
  const [featured, setFeatured] = useState(t.featured);
  const [active, setActive] = useState(t.active);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", "testimonials");
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setGuestImage(data.imageUrl);
    } catch {
      // silent
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage() {
    if (guestImage) {
      await fetch("/api/admin/upload-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: guestImage }),
      }).catch(() => {});
    }
    setGuestImage("");
  }

  if (isEditing) {
    return (
      <div className={framed ? "rounded-xl border border-neutral-200 bg-white p-5 shadow-xs" : ""}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`name-${t.id}`}>Guest name</Label>
              <Input
                id={`name-${t.id}`}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor={`type-${t.id}`}>Guest type</Label>
              <Input
                id={`type-${t.id}`}
                value={guestType}
                onChange={(e) => setGuestType(e.target.value)}
                className="mt-1.5"
                placeholder="e.g. Solo traveller, Family, Couple"
              />
            </div>
          </div>
          <div>
            <Label>Profile photo</Label>
            <div className="mt-1.5 flex items-center gap-3">
              {guestImage ? (
                <div className="relative size-12 shrink-0">
                  <Image
                    src={guestImage}
                    alt=""
                    fill
                    className="rounded-full object-cover"
                    sizes="48px"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                    aria-label="Remove photo"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-400">
                  {guestName ? guestName.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
              >
                {imageUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {imageUploading ? "Uploading…" : guestImage ? "Change photo" : "Upload photo"}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor={`text-${t.id}`}>Review text</Label>
            <Textarea
              id={`text-${t.id}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1.5 min-h-24"
              required
            />
          </div>
          <div className="flex items-center gap-6">
            <div>
              <Label htmlFor={`order-${t.id}`}>Display order</Label>
              <Input
                id={`order-${t.id}`}
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="mt-1.5 w-24"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 mt-6">
              <Checkbox
                checked={featured}
                onCheckedChange={(checked) => setFeatured(checked)}
              />
              <Star className="size-3.5 text-amber-500" />
              Featured
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 mt-6">
              <Checkbox
                checked={active}
                onCheckedChange={(checked) => setActive(checked)}
              />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button disabled={saving || !guestName.trim() || !text.trim()} onClick={() => onSave({ id: t.id.startsWith("new-") ? undefined : t.id, guestName, guestType, guestImage: guestImage || undefined, text, sortOrder, featured, active })}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t.id.startsWith("new-") ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-colors hover:border-neutral-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-neutral-800">{t.guestName}</h3>
            {t.featured && <Star className="size-3.5 text-amber-500" />}
            {!t.active && (
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                <EyeOff className="size-3" /> Hidden
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">{t.guestType}</p>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-500">&ldquo;{t.text}&rdquo;</p>
          <p className="mt-1 text-xs text-neutral-400">Order: {t.sortOrder}</p>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={onDeleteConfirmClose}
        title="Delete testimonial?"
        description={`Are you sure you want to delete "${t.guestName}"'s testimonial? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={onDeleteConfirmed}
      />
    </div>
  );
}
