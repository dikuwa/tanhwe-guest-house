"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2, EyeOff, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const router = useRouter();
  const [items, setItems] = useState<Testimonial[]>(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function save(t: { id?: string; guestName: string; guestType: string; guestImage?: string; text: string; sortOrder: number; featured: boolean; active: boolean }) {
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
    setEditing(null);
    router.refresh();
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
    router.refresh();
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
    setItems((prev) => [...prev, newItem]);
    setEditing(newItem.id);
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
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-neutral-500">
            No testimonials yet. Click "Add testimonial" to create one.
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
}: {
  testimonial: Testimonial;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: (data: { id?: string; guestName: string; guestType: string; guestImage?: string; text: string; sortOrder: number; featured: boolean; active: boolean }) => void;
  onDelete: () => void;
  onCancel: () => void;
  deleteConfirmOpen: boolean;
  onDeleteConfirmClose: (v: boolean) => void;
  onDeleteConfirmed: () => Promise<void>;
}) {
  const [guestName, setGuestName] = useState(t.guestName);
  const [guestType, setGuestType] = useState(t.guestType);
  const [text, setText] = useState(t.text);
  const [sortOrder, setSortOrder] = useState(t.sortOrder);
  const [featured, setFeatured] = useState(t.featured);
  const [active, setActive] = useState(t.active);

  if (isEditing) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`name-${t.id}`}>Guest name</Label>
              <Input
                id={`name-${t.id}`}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1.5 h-12"
                required
              />
            </div>
            <div>
              <Label htmlFor={`type-${t.id}`}>Guest type</Label>
              <Input
                id={`type-${t.id}`}
                value={guestType}
                onChange={(e) => setGuestType(e.target.value)}
                className="mt-1.5 h-12"
                placeholder="e.g. Solo traveller, Family, Couple"
              />
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
                className="mt-1.5 h-10 w-24"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 mt-6">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4 rounded border-neutral-300"
              />
              <Star className="size-3.5 text-amber-500" />
              Featured
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 mt-6">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4 rounded border-neutral-300"
              />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving || !guestName.trim() || !text.trim()} onClick={() => onSave({ id: t.id.startsWith("new-") ? undefined : t.id, guestName, guestType, text, sortOrder, featured, active })}>
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
