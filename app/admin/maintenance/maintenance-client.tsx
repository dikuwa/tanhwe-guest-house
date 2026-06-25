"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  stats: {
    testCustomers: number;
    testBookings: number;
    orphanFollowups: number;
  };
}

export function MaintenanceClient({ stats }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const actions = [
    {
      id: "clean-customers",
      label: "Delete test customers",
      description: `Remove ${stats.testCustomers} customer(s) with "test" or "demo" in their name or notes.`,
      dangerous: true,
    },
    {
      id: "clean-bookings",
      label: "Delete test bookings",
      description: `Remove ${stats.testBookings} booking(s) with "test" or "demo" in their notes.`,
      dangerous: true,
    },
    {
      id: "clean-orphan-followups",
      label: "Clean orphaned follow-ups",
      description: `Remove ${stats.orphanFollowups} follow-up(s) referencing deleted bookings.`,
      dangerous: false,
    },
  ];

  const handleAction = async (actionId: string) => {
    if (!confirm(`Are you sure you want to proceed? This action cannot be undone.`)) return;

    setLoading(actionId);
    setMessage("");

    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message ?? "Done");
        router.refresh();
      } else {
        setMessage(data.error ?? "Operation failed");
      }
    } catch {
      setMessage("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <div
          key={action.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs"
        >
          <div>
            <p className="font-medium text-neutral-800">{action.label}</p>
            <p className="mt-1 text-sm text-neutral-500">{action.description}</p>
          </div>
          <Button
            type="button"
            variant={action.dangerous ? "destructive" : "outline"}
            size="sm"
            disabled={loading !== null || (action.id === "clean-customers" && stats.testCustomers === 0)}
            onClick={() => handleAction(action.id)}
          >
            {loading === action.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            {loading === action.id ? "Running..." : "Run"}
          </Button>
        </div>
      ))}

      {message && (
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
