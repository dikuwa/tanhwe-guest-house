"use client";

import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const session = authClient.useSession();
  return {
    data: session.data,
    status: session.isPending ? "loading" : session.data ? "authenticated" : "unauthenticated",
    user: session.data?.user,
    isAuthenticated: Boolean(session.data),
  };
}

export function useHasRole(role: string) {
  const { user } = useAuth();
  return (user as (typeof user & { role?: string }) | undefined)?.role === role;
}
