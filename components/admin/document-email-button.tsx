"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentEmailButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div>
      <Button
        variant="outline"
        disabled={disabled || sending}
        onClick={async () => {
          setSending(true);
          setMessage("");
          const response = await fetch(`/api/admin/documents/${id}/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          const data = await response.json();
          setSending(false);
          setMessage(response.ok ? "Email sent." : (data.error ?? "Email could not be sent"));
        }}
      >
        {sending ? <Loader2 className="animate-spin" /> : <Mail />}
        {sending ? "Sending…" : "Email"}
      </Button>
      {message && (
        <p role="status" className="mt-1 text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
