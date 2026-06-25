"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Skull, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  stats: {
    testCustomers: number;
    testBookings: number;
    orphanFollowups: number;
    totalCustomers: number;
    totalBookings: number;
    totalPayments: number;
    totalDocuments: number;
    totalFollowups: number;
    totalReminders: number;
    totalActivityLogs: number;
  };
}

export function MaintenanceClient({ stats }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = [
    {
      id: "clean-customers",
      label: "Delete test customers",
      description: `Remove ${stats.testCustomers} customer(s) with "test" or "demo" in name or notes.`,
      icon: Trash2,
      dangerous: true,
      disabled: stats.testCustomers === 0,
    },
    {
      id: "clean-bookings",
      label: "Delete test bookings",
      description: `Remove ${stats.testBookings} booking(s) with "test" or "demo" in notes.`,
      icon: Trash2,
      dangerous: true,
      disabled: stats.testBookings === 0,
    },
    {
      id: "clean-orphan-followups",
      label: "Clean orphaned follow-ups",
      description: `Remove ${stats.orphanFollowups} follow-up(s) referencing deleted bookings.`,
      icon: Wrench,
      dangerous: false,
      disabled: stats.orphanFollowups === 0,
    },
    {
      id: "reset-all",
      label: "Reset everything — start from zero",
      description: `Delete ALL ${stats.totalCustomers} customers, ${stats.totalBookings} bookings, ${stats.totalPayments} payments, ${stats.totalDocuments} documents, ${stats.totalFollowups} follow-ups, ${stats.totalReminders} reminders, and ${stats.totalActivityLogs} activity logs. Irreversible.`, 
      icon: Skull,
      dangerous: true,
      disabled: stats.totalCustomers === 0 && stats.totalBookings === 0,
    },
  ];

  const handleAction = async (actionId: string) => {
    // Confirmation steps for dangerous actions
    if (actionId === "reset-all") {
      const step1 = confirm(
        "⚠️ RESET EVERYTHING — This will delete ALL customer, booking, payment, document, follow-up, reminder, and activity log data.\n\nThis CANNOT be undone.\n\nAre you sure?"
      );
      if (!step1) return;
      const step2 = prompt(
        'Type "RESET" to confirm you want to delete ALL data and start from zero.'
      );
      if (step2 !== "RESET") {
        toast.error("Reset cancelled");
        return;
      }
    } else if (actionId === "clean-customers" || actionId === "clean-bookings") {
      if (!confirm(`⚠️ This will permanently delete matching records. This cannot be undone. Continue?`)) return;
    } else {
      if (!confirm(`Proceed with this cleanup?`)) return;
    }

    setLoading(actionId);

    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message ?? "Done");
        router.refresh();
      } else {
        toast.error(data.error ?? "Operation failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  // Separate critical and non-critical actions
  const critical = actions.filter((a) => a.dangerous);
  const routine = actions.filter((a) => !a.dangerous);

  return (
    <div className="space-y-6">
      {/* Routine cleanup */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-800">Routine cleanup</h2>
        <p className="mt-0.5 text-xs text-neutral-500">Safe operations to clean up test and orphaned data.</p>
        <div className="mt-3 space-y-2">
          {routine.map((action) => (
            <ActionRow key={action.id} action={action} loading={loading} onClick={handleAction} />
          ))}
        </div>
      </section>

      {/* Critical operations */}
      <section className="rounded-lg border border-red-200 bg-red-50/50 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div>
            <h2 className="text-sm font-semibold text-red-800">Critical operations</h2>
            <p className="mt-0.5 text-xs text-red-600">
              These actions permanently delete data and cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {critical.map((action) => (
            <ActionRow key={action.id} action={action} loading={loading} onClick={handleAction} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionRow({
  action,
  loading,
  onClick,
}: {
  action: { id: string; label: string; description: string; icon: React.ComponentType<{ className?: string }>; dangerous: boolean; disabled: boolean };
  loading: string | null;
  onClick: (id: string) => void;
}) {
  const Icon = action.icon;
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border p-4 shadow-xs ${
        action.dangerous ? "border-red-200 bg-white" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <Icon className={`mt-0.5 size-4 shrink-0 ${action.dangerous ? "text-red-500" : "text-neutral-400"}`} />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${action.dangerous ? "text-red-800" : "text-neutral-800"}`}>{action.label}</p>
          <p className="mt-0.5 text-xs text-neutral-500 leading-relaxed">{action.description}</p>
        </div>
      </div>
      <Button
        type="button"
        variant={action.dangerous ? "destructive" : "outline"}
        size="sm"
        disabled={loading !== null || action.disabled}
        onClick={() => onClick(action.id)}
        className="shrink-0"
      >
        {loading === action.id ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : action.dangerous ? (
          <Trash2 className="size-3.5" />
        ) : (
          <Wrench className="size-3.5" />
        )}
        {loading === action.id ? "Running..." : action.dangerous ? "Delete" : "Run"}
      </Button>
    </div>
  );
}
