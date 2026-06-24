"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2, EyeOff, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    if (!confirm("Delete this testimonial?")) return;
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
    setItems([...items, newItem]);
    setEditing(newItem.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={addNew}>
          <Plus className="size-4" /> Add testimonial
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <TestimonialRow
            key={item.id}
            testimonial={item}
            isEditing={editing === item.id}
            saving={saving === item.id || (saving === "new" && editing === item.id)}
            onEdit={() => setEditing(item.id)}
            onSave={(data) => save(data)}
            onDelete={() => remove(item.id)}
            onCancel={() => {
              if (!item.guestName) setItems((prev) => prev.filter((i) => i.id !== item.id));
              setEditing(null);
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
}: {
  testimonial: Testimonial;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: (data: { id?: string; guestName: string; guestType: string; guestImage?: string; text: string; sortOrder: number; featured: boolean; active: boolean }) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [guestName, setGuestName] = useState(t.guestName);
  const [guestType, setGuestType] = useState(t.guestType);
  const [guestImage, setGuestImage] = useState(t.guestImage ?? "");
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
              <Label htmlFor={`t-name-${t.id}`}>Guest name</Label>
              <Input id={`t-name-${t.id}`} value={guestName} onChange={(e) => setGuestName(e.target.value)} className="mt-1.5 h-12" required />
            </div>
            <div>
              <Label htmlFor={`t-type-${t.id}`}>Guest type / role</Label>
              <Input id={`t-type-${t.id}`} value={guestType} onChange={(e) => setGuestType(e.target.value)} className="mt-1.5 h-12" placeholder="e.g. Business traveller" required />
            </div>
          </div>
          <div>
            <Label htmlFor={`t-img-${t.id}`}>Guest image URL (optional)</Label>
            <Input id={`t-img-${t.id}`} value={guestImage} onChange={(e) => setGuestImage(e.target.value)} className="mt-1.5 h-12" placeholder="Leave blank to show initials" />
          </div>
          <div>
            <Label htmlFor={`t-text-${t.id}`}>Testimonial text</Label>
            <Textarea id={`t-text-${t.id}`} value={text} onChange={(e) => setText(e.target.value)} className="mt-1.5 min-h-24" required />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <Label htmlFor={`t-order-${t.id}`}>Display order</Label>
              <Input id={`t-order-${t.id}`} type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="mt-1.5 h-10 w-24" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 mt-5">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="size-4 rounded border-neutral-300" />
              <Star className="size-3.5 text-amber-500" /> Featured
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 mt-5">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 rounded border-neutral-300" />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button size="sm" disabled={saving || !guestName.trim() || !text.trim()} onClick={() => onSave({
              id: t.id.startsWith("new-") ? undefined : t.id,
              guestName, guestType, guestImage: guestImage || undefined, text, sortOrder, featured, active,
            })}>
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
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {t.guestName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-neutral-800">{t.guestName}</h3>
              <p className="text-xs text-neutral-400">{t.guestType}</p>
            </div>
            {t.featured && <Star className="size-3.5 text-amber-500 fill-amber-500" />}
            {!t.active && <EyeOff className="size-3.5 text-neutral-400" />}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-neutral-500 italic">&ldquo;{t.text}&rdquo;</p>
          <p className="mt-1 text-xs text-neutral-400">Order: {t.sortOrder}</p>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
