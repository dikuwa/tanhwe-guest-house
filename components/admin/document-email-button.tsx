"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

export function DocumentEmailButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [sending, setSending] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={disabled || sending}
      onClick={async () => {
        setSending(true);
        const response = await fetch(`/api/admin/documents/${id}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = await response.json();
        setSending(false);
        if (response.ok) {
          toast.success("Email sent");
        } else {
          toast.error(data.error ?? "Email could not be sent");
        }
      }}
    >
      {sending ? <Loader2 className="animate-spin" /> : <Mail />}
      {sending ? "Sending…" : "Email"}
    </Button>
  );
}
