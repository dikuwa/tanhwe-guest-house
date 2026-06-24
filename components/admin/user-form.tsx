"use client";

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
import { cn } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

function validateEmail(value: string): string | undefined {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return undefined;
}

export function UserForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState("staff");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validateForm(formData: FormData): boolean {
    const errors: FieldErrors = {};
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name) errors.name = "Name is required";
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    const passwordErr = validatePassword(password);
    if (passwordErr) errors.password = passwordErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    if (!validateForm(formData)) return;

    setSaving(true);
    const payload = {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      role,
      mustChangePassword,
    };

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setSaving(false);

      if (!response.ok) {
        setError(data.error ?? "Could not create user");
        return;
      }

      setSuccess(
        `User created successfully. ${mustChangePassword ? "They will be prompted to change their password on first login." : "User can log in immediately."}`
      );
      // Reset form
      (event.currentTarget as HTMLFormElement).reset();
      setRole("staff");
      setMustChangePassword(true);
      router.refresh();
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            required
            className={cn("mt-2 h-12", fieldErrors.name && "border-destructive")}
            placeholder="e.g. John Doe"
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className={cn("mt-2 h-12", fieldErrors.email && "border-destructive")}
            placeholder="john@example.com"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Temporary password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className={cn("mt-2 h-12", fieldErrors.password && "border-destructive")}
            placeholder="Min. 8 characters"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(v) => v && setRole(v)}>
            <SelectTrigger id="role" className="mt-2 h-12 w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:col-span-2">
          <Checkbox
            id="mustChangePassword"
            checked={mustChangePassword}
            onCheckedChange={(checked) => setMustChangePassword(Boolean(checked))}
          />
          <label htmlFor="mustChangePassword" className="cursor-pointer text-sm text-neutral-700">
            User must change password on first login (recommended for security)
          </label>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Creating..." : "Create user"}
        </Button>
      </div>
    </form>
  );
}
