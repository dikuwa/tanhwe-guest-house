"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const [role, setRole] = useState<"owner" | "admin" | "staff">("staff");
  const [sendMethod, setSendMethod] = useState<"none" | "email">("none");
  const [grants, setGrants] = useState<Permission[]>(getRoleDefaults("staff"));
  const [{ nameErr, emailErr, passwordErr }, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  function handleRoleChange(value: string | null) {
    const newRole = value as "owner" | "admin" | "staff";
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
    <div>
      <Button onClick={() => setOpen(true)}>Add user</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New user</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>X</Button>
            </div>

            <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="uf-name">Name</Label>
                <Input id="uf-name" value={name} onChange={(e) => setName(e.target.value)} />
                {nameErr && <p className="mt-1 text-sm text-red-500">{nameErr}</p>}
              </div>

              <div>
                <Label htmlFor="uf-email">Email</Label>
                <Input id="uf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {emailErr && <p className="mt-1 text-sm text-red-500">{emailErr}</p>}
              </div>

              <div>
                <Label htmlFor="uf-phone">Phone</Label>
                <Input id="uf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="uf-jobTitle">Job title</Label>
                <Input id="uf-jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="uf-password">Password</Label>
                <Input id="uf-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 12 characters" />
                {passwordErr && <p className="mt-1 text-sm text-red-500">{passwordErr}</p>}
              </div>

              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Send login details via</Label>
                <Select value={sendMethod} onValueChange={(v) => setSendMethod(v as "none" | "email")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Manually copy later</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Permissions</Label>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded border p-2 text-sm">
                  {Object.values(PERMISSIONS).map((perm) => {
                    const disabled = isOwnerOnly(perm) && role !== "owner";
                    const checked = grants.includes(perm);
                    return (
                      <label key={perm} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={disabled || checked}
                          disabled={disabled}
                          onChange={() => togglePermission(perm)}
                        />
                        <span className={disabled ? "text-gray-400" : ""}>{perm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create user"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
