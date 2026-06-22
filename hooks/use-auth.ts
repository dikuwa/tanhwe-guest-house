import { useSession } from "next-auth/react";

export function useAuth() {
  const session = useSession();
  return {
    data: session.data,
    status: session.status,
    user: session.data?.user,
    isAuthenticated: session.status === "authenticated",
  };
}

export function useHasRole(role: string) {
  const { user } = useAuth();
  return user?.role === role;
}