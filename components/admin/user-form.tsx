"use client";

import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSIONS, getRoleDefaults, isOwnerOnly } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import { Crown, Eye, EyeOff, Plus, Shield, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  bookings: "Bookings",
  rooms: "Rooms",
  customers: "Customers",
  payments: "Payments",
  documents: "Documents",
  follow_ups: "Follow-ups",
  users: "Users",
  permissions: "Permissions",
  settings: "Settings",
  finance: "Finance",
  security: "Security",
  testimonials: "Testimonials",
  faqs: "FAQs",
  dashboard: "Dashboard",
};

const permissionGroups: { label: string; permissions: Permission[] }[] = (() => {
  const groups = new Map<string, Permission[]>();
  const order: string[] = [];
  for (const perm of Object.values(PERMISSIONS)) {
    const category = perm.split(":")[0] as keyof typeof categoryLabels;
    if (!groups.has(category)) {
      groups.set(category, []);
      order.push(category);
    }
    groups.get(category)!.push(perm);
  }
  return order.map((cat) => ({
    label: categoryLabels[cat] || cat,
    permissions: groups.get(cat)!,
  }));
})();

function permissionLabel(perm: string): string {
  return perm.split(":").pop()!.replace(/_/g, " ");
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  staff: User,
} as const;

interface UserFormProps {
  onCreated?: (user: { id: string; name: string; email: string; role: string; status: string }) => void;
}

export function UserForm({ onCreated }: UserFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"owner" | "admin" | "staff">("staff");
  const [sendMethod, setSendMethod] = useState<"none" | "email">("none");
  const [grants, setGrants] = useState<Permission[]>(getRoleDefaults("staff"));
  const [{ nameErr, emailErr, passwordErr }, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  function handleRoleChange(newRole: "owner" | "admin" | "staff") {
    setRole(newRole);
    setGrants(getRoleDefaults(newRole));
  }

  function togglePermission(permission: Permission) {
    setGrants((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.nameErr = "Name is required";
    if (!email.trim()) errs.emailErr = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.emailErr = "Invalid email";
    if (password && password.length < 12) errs.passwordErr = "Password must be at least 12 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          jobTitle: jobTitle.trim(),
          password: password || undefined,
          role,
          sendMethod,
          permissionGrants: grants,
          permissionRestrictions: [],
          mustChangePassword: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }

      const result = await res.json();
      toast.success(`${name.trim()} (${role}) created`);
      setOpen(false);
      setName(""); setEmail(""); setPhone(""); setJobTitle(""); setPassword("");
      setRole("staff"); setSendMethod("none"); setGrants(getRoleDefaults("staff"));
      setShowPassword(false);
      setErrors({});
      formRef.current?.reset();

      onCreated?.(result.user);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add user
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 flex w-full max-w-[720px] max-h-[88vh] flex-col rounded-xl border bg-card shadow-lg">
            <form ref={formRef} onSubmit={onSubmit} className="flex max-h-[88vh] flex-col">
              <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
                <h2 className="text-lg font-semibold">New user</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="uf-name">Name</Label>
                    <Input id="uf-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11" />
                    {nameErr && <p className="mt-1 text-sm text-red-500">{nameErr}</p>}
                  </div>
                  <div>
                    <Label htmlFor="uf-email">Email</Label>
                    <Input id="uf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" />
                    {emailErr && <p className="mt-1 text-sm text-red-500">{emailErr}</p>}
                  </div>
                  <div>
                    <Label htmlFor="uf-phone">Phone</Label>
                    <Input id="uf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="uf-jobTitle">Job title</Label>
                    <Input id="uf-jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="uf-password">Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="uf-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 12 characters"
                        className="pr-9 h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {passwordErr && <p className="mt-1 text-sm text-red-500">{passwordErr}</p>}
                  </div>
                  <div>
                    <Label>Send login details via</Label>
                    <div className="mt-1.5">
                      <Select value={sendMethod} onValueChange={(v) => setSendMethod(v as "none" | "email")}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Manually copy later</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Label>Role</Label>
                  <div className="mt-1.5 grid grid-cols-3 gap-3">
                    {(["owner", "admin", "staff"] as const).map((r) => {
                      const Icon = roleIcons[r];
                      const selected = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRoleChange(r)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors",
                            selected
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                          )}
                          aria-pressed={selected}
                        >
                          <Icon className="size-5" />
                          <span className="capitalize">{r}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Role permissions are applied automatically.
                  </p>
                </div>

                <div className="mt-5">
                  <Label className="mb-2 block">Permissions</Label>
                  <div className="max-h-64 overflow-y-auto rounded-lg border p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {permissionGroups.map((group) => (
                        <div key={group.label}>
                          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                            {group.label}
                          </h4>
                          <div className="space-y-1">
                            {group.permissions.map((perm) => {
                              const disabled = isOwnerOnly(perm) && role !== "owner";
                              const checked = grants.includes(perm);
                              return (
                                <label
                                  key={perm}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-2 text-sm",
                                    disabled && "cursor-not-allowed"
                                  )}
                                >
                                  <Checkbox
                                    checked={disabled || checked}
                                    disabled={disabled}
                                    onCheckedChange={() => togglePermission(perm)}
                                  />
                                  <span className={disabled ? "text-muted-foreground" : ""}>
                                    {permissionLabel(perm)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create user"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
