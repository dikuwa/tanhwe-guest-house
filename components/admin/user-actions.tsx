"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface UserActionsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  currentUserId: string;
  onUpdate: (userId: string, updates: Partial<{ status: string }>) => void;
  onDelete: (userId: string) => void;
}

export function UserActions({ user, currentUserId, onUpdate, onDelete }: UserActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    title: string;
    description: string;
  } | null>(null);
  const [, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function performAction(action: string, reason?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }

      toast.success(`${action} successful`);

      if (action === "delete") onDelete(user.id);
      else if (action === "disable") onUpdate(user.id, { status: "disabled" });
      else if (action === "enable") onUpdate(user.id, { status: "active" });
      else if (action === "revoke") onUpdate(user.id, { status: "revoked" });
      else if (action === "restore") onUpdate(user.id, { status: "active" });
      else if (action === "unlock") onUpdate(user.id, { status: "active" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
      setConfirmAction(null);
      setMenuOpen(false);
    }
  }

  const isSelf = user.id === currentUserId;

  const items: { label: string; action: string; condition: boolean }[] = [
    { label: "Resend invitation", action: "resend_invitation", condition: user.status === "invited" },
    { label: "Disable", action: "disable", condition: user.status === "active" && !isSelf },
    { label: "Revoke", action: "revoke", condition: (user.status === "active" || user.status === "disabled") && !isSelf },
    { label: "Enable", action: "enable", condition: user.status === "disabled" },
    { label: "Restore", action: "restore", condition: user.status === "revoked" },
    { label: "Unlock", action: "unlock", condition: user.status === "locked" },
    { label: "Delete", action: "delete", condition: user.status !== "invited" },
  ];

  const descriptions: Record<string, string> = {
    resend_invitation: `Send the invitation email again to ${user.email}.`,
    disable: `${user.name} will not be able to log in until re-enabled.`,
    revoke: `${user.name} will lose all access.`,
    enable: `${user.name} will be able to log in again.`,
    restore: `${user.name} will regain access.`,
    unlock: `${user.name} will be able to log in again.`,
    delete: `${user.name} will be permanently removed. This action cannot be undone.`,
  };

  const titles: Record<string, string> = {
    resend_invitation: "Resend invitation?",
    disable: "Disable user?",
    revoke: "Revoke user?",
    enable: "Enable user?",
    restore: "Restore user?",
    unlock: "Unlock user?",
    delete: "Delete user?",
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)}>...</Button>

      {menuOpen && (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border bg-white py-1 shadow-lg">
          {items
            .filter((item) => item.condition)
            .map((item) => (
              <button
                key={item.action}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                onClick={() => {
                  setConfirmAction({
                    action: item.action,
                    title: titles[item.action] || "Confirm?",
                    description: descriptions[item.action] || "Are you sure?",
                  });
                }}
              >
                {item.label}
              </button>
            ))}
          {items.filter((item) => item.condition).length === 0 && (
            <div className="px-3 py-1.5 text-sm text-gray-400">No actions</div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(v: boolean) => { if (!v) { setConfirmAction(null); setMenuOpen(false); } }}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={() => confirmAction ? performAction(confirmAction.action) : Promise.resolve()}
      />
    </div>
  );
}
