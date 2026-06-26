"use client";

import { useState, useMemo } from "react";
import { UserForm } from "@/components/admin/user-form";
import { UserActions } from "@/components/admin/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  image: string | null;
  phone: string | null;
  jobTitle: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
}

interface UsersTableProps {
  users: User[];
  currentUserId: string;
}

type StatusFilter = "all" | "active" | "invited" | "disabled" | "revoked" | "locked";

export function UsersTable({ users: initial, currentUserId }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (user.deletedAt) return false;
      if (statusFilter !== "all" && user.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.phone && user.phone.toLowerCase().includes(q)) ||
          user.role.toLowerCase().includes(q) ||
          (user.jobTitle && user.jobTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [users, search, statusFilter]);

  const summary = useMemo(() => {
    const activeUsers = users.filter((u) => !u.deletedAt);
    return {
      total: activeUsers.length,
      active: activeUsers.filter((u) => u.status === "active").length,
      invited: activeUsers.filter((u) => u.status === "invited").length,
      disabled: activeUsers.filter((u) => u.status === "disabled").length,
      revoked: activeUsers.filter((u) => u.status === "revoked").length,
      locked: activeUsers.filter((u) => u.status === "locked").length,
    };
  }, [users]);

  function handleUpdate(userId: string, updates: Partial<{ status: string }>) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
  }

  function handleDelete(userId: string) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, deletedAt: new Date(), status: "revoked" } : u)));
  }

  function handleCreated(newUser: { id: string; name: string; email: string; role: string; status: string }) {
    const fullUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      image: null,
      phone: null,
      jobTitle: null,
      lastLoginAt: null,
      createdAt: new Date(),
      deletedAt: null,
    };
    setUsers((prev) => [fullUser, ...prev]);
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    invited: "bg-blue-100 text-blue-800",
    disabled: "bg-yellow-100 text-yellow-800",
    revoked: "bg-red-100 text-red-800",
    locked: "bg-gray-200 text-gray-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "active", "invited", "disabled", "revoked", "locked"] as const).map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f)}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({summary[f === "all" ? "total" : f]})
            </Button>
          ))}
        </div>
        <UserForm onCreated={handleCreated} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, email, phone, role, or job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search users"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-200 text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Job title</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="size-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs text-muted-foreground">You</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 capitalize">{user.role}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[user.status] || "bg-gray-100 text-gray-800"}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted-foreground">{user.jobTitle || "—"}</td>
                <td className="px-4 py-4 text-muted-foreground">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-NA") : "—"}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {user.createdAt.toLocaleDateString("en-NA")}
                </td>
                <td className="px-4 py-4">
                  <UserActions
                    user={user}
                    currentUserId={currentUserId}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
