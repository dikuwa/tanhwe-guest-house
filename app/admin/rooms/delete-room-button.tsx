"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteRoomButton({
  id,
  name,
  disabled,
  onDeleted,
}: {
  id: string;
  name: string;
  disabled?: boolean;
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<{
    action: "delete" | "archive";
    bookingCount?: number;
  } | null>(null);

  async function handleDeleteClick() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
      const data = await response.json();
      setSaving(false);

      if (!response.ok) {
        toast.error(data.error ?? "Could not delete room");
        return;
      }

      if (data.action === "permanent-delete") {
        setDialogProps({ action: "delete" });
      } else if (data.action === "archive") {
        setDialogProps({ action: "archive", bookingCount: data.bookingCount });
      }
      setDialogOpen(true);
    } catch {
      setSaving(false);
      toast.error("Could not delete room");
    }
  }

  async function confirmDelete() {
    onDeleted?.(id);
    router.refresh();
  }

  const isDelete = dialogProps?.action === "delete";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={saving || disabled}
        onClick={handleDeleteClick}
        className="text-red-600 hover:text-red-700 hover:border-red-200"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </Button>

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isDelete ? "Delete room?" : "Archive room?"}
        description={
          isDelete
            ? `You are about to permanently delete "${name}". This will also remove its room images and related configuration. This action cannot be undone.`
            : `"${name}" has existing booking or document history. It will be removed from active listings and cannot be selected for new bookings, but its historical records will remain available.`
        }
        confirmLabel={isDelete ? "Delete Room" : "Archive Room"}
        variant={isDelete ? "destructive" : "archive"}
        onConfirm={confirmDelete}
      />
    </>
  );
}
