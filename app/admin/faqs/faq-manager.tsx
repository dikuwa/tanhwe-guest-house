"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
};

export function FaqManager({ initial }: { initial: Faq[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Faq[]>(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  async function save(faq: { id?: string; question: string; answer: string; sortOrder: number; active: boolean }) {
    setSaving(faq.id ?? "new");
    setError("");
    const method = faq.id ? "PATCH" : "POST";
    const response = await fetch("/api/admin/faqs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(faq),
    });
    setSaving(null);
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Could not save FAQ");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    setSaving(id);
    await fetch("/api/admin/faqs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSaving(null);
    setItems((prev) => prev.filter((item) => item.id !== id));
    router.refresh();
  }

  function addNew() {
    const newItem: Faq = {
      id: `new-${Date.now()}`,
      question: "",
      answer: "",
      sortOrder: items.length + 1,
      active: true,
    };
    setItems([...items, newItem]);
    setEditing(newItem.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={addNew}>
          <Plus className="size-4" /> Add FAQ
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <FaqRow
            key={item.id}
            faq={item}
            isEditing={editing === item.id}
            saving={saving === item.id || saving === "new" && editing === item.id}
            onEdit={() => setEditing(item.id)}
            onSave={(data) => save(data)}
            onDelete={() => remove(item.id)}
            onCancel={() => {
              if (!item.question) setItems((prev) => prev.filter((i) => i.id !== item.id));
              setEditing(null);
            }}
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-neutral-500">
            No FAQs yet. Click "Add FAQ" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function FaqRow({
  faq,
  isEditing,
  saving,
  onEdit,
  onSave,
  onDelete,
  onCancel,
}: {
  faq: Faq;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: (data: { id?: string; question: string; answer: string; sortOrder: number; active: boolean }) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [sortOrder, setSortOrder] = useState(faq.sortOrder);
  const [active, setActive] = useState(faq.active);

  if (isEditing) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div className="space-y-4">
          <div>
            <Label htmlFor={`faq-q-${faq.id}`}>Question</Label>
            <Input
              id={`faq-q-${faq.id}`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1.5 h-12"
              required
            />
          </div>
          <div>
            <Label htmlFor={`faq-a-${faq.id}`}>Answer</Label>
            <Textarea
              id={`faq-a-${faq.id}`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="mt-1.5 min-h-24"
              required
            />
          </div>
          <div className="flex items-center gap-6">
            <div>
              <Label htmlFor={`faq-order-${faq.id}`}>Display order</Label>
              <Input
                id={`faq-order-${faq.id}`}
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
            <Button size="sm" disabled={saving || !question.trim() || !answer.trim()} onClick={() => onSave({ id: faq.id.startsWith("new-") ? undefined : faq.id, question, answer, sortOrder, active })}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {faq.id.startsWith("new-") ? "Create" : "Save"}
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
            <h3 className="font-medium text-neutral-800">{faq.question}</h3>
            {!faq.active && (
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                <EyeOff className="size-3" /> Hidden
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{faq.answer}</p>
          <p className="mt-1 text-xs text-neutral-400">Order: {faq.sortOrder}</p>
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
