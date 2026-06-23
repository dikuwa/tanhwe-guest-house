"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UserRole({
  id,
  role,
  disabled,
}: {
  id: string;
  role: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <Select
      value={role}
      onValueChange={async (value) => {
        if (value === role) return;
        setSaving(true);
        const response = await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: value }),
        });
        setSaving(false);
        if (response.ok) router.refresh();
      }}
      disabled={disabled || saving}
    >
      <SelectTrigger className="h-9 w-auto min-w-[100px] text-sm capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="owner">Owner</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="staff">Staff</SelectItem>
      </SelectContent>
    </Select>
  );
}
