"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function UserRole({ id, role, disabled }: { id: string; role: string; disabled?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  return (
    <select
      aria-label="User role"
      defaultValue={role}
      disabled={disabled || saving}
      onChange={async (event) => {
        setSaving(true);
        const response = await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: event.target.value }),
        });
        setSaving(false);
        if (response.ok) router.refresh();
        else event.target.value = role;
      }}
      className="h-9 rounded-lg border bg-background px-3 text-sm capitalize"
    >
      <option value="owner">Owner</option>
      <option value="admin">Admin</option>
      <option value="staff">Staff</option>
    </select>
  );
}
