"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export function FollowUpComplete({ id }: { id: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={saving}
      onClick={async () => {
        setSaving(true);
        const response = await fetch(`/api/admin/follow-ups/${id}`, { method: "PATCH" });
        setSaving(false);
        if (response.ok) router.refresh();
      }}
    >
      {saving ? <Loader2 className="animate-spin" /> : <Check />}Complete
    </Button>
  );
}
