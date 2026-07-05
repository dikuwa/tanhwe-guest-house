"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Edit3,
  Loader2,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/ui/status-pill";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FolioItem = {
  id: string;
  name: string;
  itemType: "service" | "charge" | "discount";
  category: string;
  defaultPrice: number;
  description: string | null;
  status: "active" | "inactive";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const ITEM_TYPES = [
  { value: "service", label: "Service" },
  { value: "charge", label: "Charge" },
  { value: "discount", label: "Discount" },
] as const;

const CATEGORIES = [
  "Food & Beverage",
  "Transport",
  "Housekeeping",
  "Accommodation",
  "Miscellaneous",
  "Discounts",
  "Other",
] as const;

const typeColors: Record<string, string> = {
  service: "bg-blue-100 text-blue-700",
  charge: "bg-purple-100 text-purple-700",
  discount: "bg-amber-100 text-amber-700",
};

export function ExtraItemsManager() {
  const router = useRouter();
  const [items, setItems] = useState<FolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<FolioItem | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadItems() {
    setLoading(true);
    const res = await fetch("/api/admin/folio-items");
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredItems = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && item.itemType !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const itemType = String(form.get("itemType") ?? "");
    const category = String(form.get("category") ?? "Other");
    const defaultPrice = Number(form.get("defaultPrice") ?? 0);
    const description = String(form.get("description") ?? "").trim();

    if (!name) return toast.error("Item name is required");
    if (!itemType) return toast.error("Item type is required");

    setSaving("new");
    try {
      const response = await fetch("/api/admin/folio-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          itemType,
          category,
          defaultPrice,
          description: description || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) return toast.error(data.error ?? "Could not create item");
      toast.success(`${data.name} created`);
      setShowCreate(false);
      loadItems();
      router.refresh();
    } catch {
      toast.error("Could not create item");
    } finally {
      setSaving(null);
    }
  }

  async function handleUpdate(id: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const itemType = String(form.get("itemType") ?? "");
    const category = String(form.get("category") ?? "Other");
    const defaultPrice = Number(form.get("defaultPrice") ?? 0);
    const description = String(form.get("description") ?? "").trim();
    const status = String(form.get("status") ?? "active");

    if (!name) return toast.error("Item name is required");
    if (!itemType) return toast.error("Item type is required");

    setSaving(id);
    try {
      const response = await fetch(`/api/admin/folio-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          itemType,
          category,
          defaultPrice,
          description: description || null,
          status,
        }),
      });
      const data = await response.json();
      if (!response.ok) return toast.error(data.error ?? "Could not update item");
      toast.success(`${name} updated`);
      setEditing(null);
      loadItems();
      router.refresh();
    } catch {
      toast.error("Could not update item");
    } finally {
      setSaving(null);
    }
  }

  async function handleDuplicate(item: FolioItem) {
    setSaving(item.id);
    try {
      const response = await fetch("/api/admin/folio-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${item.name} (copy)`,
          itemType: item.itemType,
          category: item.category,
          defaultPrice: item.defaultPrice,
          description: item.description || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) return toast.error(data.error ?? "Could not duplicate item");
      toast.success(`${data.name} created`);
      loadItems();
      router.refresh();
    } catch {
      toast.error("Could not duplicate item");
    } finally {
      setSaving(null);
    }
  }

  async function handleDeactivate(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setSaving(id);
    try {
      const response = await fetch(`/api/admin/folio-items/${id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return toast.error(data.error ?? "Could not deactivate item");
      toast.success(`${item.name} deactivated`);
      loadItems();
      router.refresh();
    } catch {
      toast.error("Could not deactivate item");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Inventory
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-neutral-800">
          Extra Services, Discounts & Charges
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage predefined services, discounts and charges that can be added to
          bookings and documents.
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="h-9 w-48 pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { if (v) setTypeFilter(v); }}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="service">Services</SelectItem>
              <SelectItem value="charge">Charges</SelectItem>
              <SelectItem value="discount">Discounts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          Add new item
        </Button>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "No extra services or charges have been added yet."
              : "No items match the current filters."}
          </p>
          {items.length === 0 && (
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              Add first item
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
          </p>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6"
            >
              {editing === item.id ? (
                <form
                  onSubmit={(e) => handleUpdate(item.id, e)}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`edit-name-${item.id}`}>Item name</Label>
                      <Input
                        id={`edit-name-${item.id}`}
                        name="name"
                        defaultValue={item.name}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-type-${item.id}`}>Item type</Label>
                      <Select
                        name="itemType"
                        defaultValue={item.itemType}
                      >
                        <SelectTrigger
                          id={`edit-type-${item.id}`}
                          className="mt-1 w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`edit-category-${item.id}`}>
                        Category
                      </Label>
                      <Select name="category" defaultValue={item.category}>
                        <SelectTrigger
                          id={`edit-category-${item.id}`}
                          className="mt-1 w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`edit-price-${item.id}`}>
                        Default price (N$)
                      </Label>
                      <Input
                        id={`edit-price-${item.id}`}
                        name="defaultPrice"
                        type="number"
                        min="0"
                        defaultValue={item.defaultPrice}
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor={`edit-desc-${item.id}`}>
                        Description{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        id={`edit-desc-${item.id}`}
                        name="description"
                        defaultValue={item.description ?? ""}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-status-${item.id}`}>Status</Label>
                      <Select name="status" defaultValue={item.status}>
                        <SelectTrigger
                          id={`edit-status-${item.id}`}
                          className="mt-1 w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving === item.id}>
                      {saving === item.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                    >
                      <X className="size-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-neutral-800">
                        {item.name}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
                          typeColors[item.itemType] ?? "bg-gray-100 text-gray-700"
                        )}
                      >
                        {item.itemType === "service"
                          ? "Service"
                          : item.itemType === "charge"
                            ? "Charge"
                            : "Discount"}
                      </span>
                      <StatusPill
                        status={item.status === "active" ? "active" : "inactive"}
                        label={item.status === "active" ? "Active" : "Inactive"}
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                      <span>{item.category}</span>
                      <span className="font-medium text-neutral-700">
                        N${item.defaultPrice.toLocaleString()}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm text-neutral-600">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleDuplicate(item)}
                      title="Duplicate"
                      disabled={saving === item.id}
                    >
                      {saving === item.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditing(item.id)}
                      title="Edit"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>
                    {item.status === "active" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-neutral-400 hover:text-red-600"
                        onClick={() => handleDeactivate(item.id)}
                        title="Deactivate"
                        disabled={saving === item.id}
                      >
                        {saving === item.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-neutral-400 hover:text-red-600"
                        onClick={() => setDeleteConfirm(item)}
                        title="Delete"
                        disabled={saving === item.id}
                      >
                        {saving === item.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(v) => {
          if (saving !== "new") setShowCreate(v);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New item</DialogTitle>
            <DialogDescription>
              Add a predefined service, charge or discount.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="dlg-name">Item name</Label>
              <Input
                id="dlg-name"
                name="name"
                className="mt-1.5"
                placeholder="e.g. Breakfast"
                required
              />
            </div>
            <div>
              <Label htmlFor="dlg-type">Item type</Label>
              <Select name="itemType" defaultValue="">
                <SelectTrigger id="dlg-type" className="mt-1.5 w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dlg-category">Category</Label>
              <Select name="category" defaultValue="Other">
                <SelectTrigger id="dlg-category" className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dlg-price">Default price (N$)</Label>
              <Input
                id="dlg-price"
                name="defaultPrice"
                type="number"
                min="0"
                defaultValue="0"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="dlg-desc">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="dlg-desc"
                name="description"
                className="mt-1.5"
                rows={2}
                placeholder="Brief description of the item"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
                disabled={saving === "new"}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving === "new"}>
                {saving === "new" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Create item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
          onConfirm={async () => {
            const item = deleteConfirm;
            setDeleteConfirm(null);
            await handleDeactivate(item.id);
          }}
          title={`Delete ${deleteConfirm.name}?`}
          description={`This will permanently deactivate "${deleteConfirm.name}". It can be reactivated later.`}
          confirmLabel="Deactivate"
          variant="destructive"
        />
      )}
    </div>
  );
}
