"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteRoomButton({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleDelete() {
    const msg =
      `Are you sure you want to delete "${name}"?\n\n` +
      `This room will be deactivated (archived) to preserve any existing booking history. ` +
      `It can be reactivated later from the room edit page.\n\n` +
      `This action cannot be undone.`;

    if (!confirm(msg)) return;

    setSaving(true);
    const response = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json();
      alert(data.error ?? "Could not delete room");
      return;
    }

    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={saving || disabled}
      onClick={handleDelete}
      className="text-red-600 hover:text-red-700 hover:border-red-200"
    >
      {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
