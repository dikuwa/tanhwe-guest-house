"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Skull, Trash2, Wrench } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [resetCode, setResetCode] = useState("");

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
    if (actionId === "reset-all") {
      setShowResetPrompt(true);
      return;
    }
    setConfirmAction(actionId);
  };

  const executeAction = async (actionId: string) => {
    setLoading(actionId);
    setConfirmAction(null);

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

  const executeReset = async () => {
    if (resetCode !== "RESET") {
      toast.error("Reset cancelled");
      setShowResetPrompt(false);
      setResetCode("");
      return;
    }

    setLoading("reset-all");
    setShowResetPrompt(false);
    setResetCode("");

    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-all" }),
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

  // Figure out which action is being confirmed
  const pendingAction = actions.find((a) => a.id === confirmAction);

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

      {/* Confirmation dialog for delete/cleanup actions */}
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(v) => { if (!v) setConfirmAction(null); }}
        title={pendingAction?.dangerous ? "Permanently delete records?" : "Proceed with cleanup?"}
        description={
          pendingAction?.dangerous
            ? `This will permanently delete matching records. This cannot be undone. Continue?`
            : `Proceed with this cleanup?`
        }
        confirmLabel="Continue"
        variant={pendingAction?.dangerous ? "destructive" : "default"}
        onConfirm={async () => {
          if (confirmAction) await executeAction(confirmAction);
        }}
      />

      {/* Reset confirmation dialog */}
      {showResetPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <Skull className="mt-0.5 size-5 shrink-0 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Reset everything?</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  This will delete ALL customers, bookings, payments, documents, follow-ups, reminders, and activity logs. This CANNOT be undone.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-neutral-700">
                Type <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-sm text-red-600">RESET</code> to confirm:
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Type RESET to confirm"
                autoFocus
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowResetPrompt(false); setResetCode(""); }}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={resetCode !== "RESET"} onClick={executeReset}>
                {loading === "reset-all" ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Trash2 className="mr-1.5 size-4" />}
                Delete everything
              </Button>
            </div>
          </div>
        </div>
      )}
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
