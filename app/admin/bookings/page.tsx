import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-middleware";
import type { NextRequest } from "next/server";

export default async function AdminBookings() {
  const request = new NextRequest(new URL("http://localhost:3000/admin/bookings"));
  const session = await requireRole("admin", request);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-playfair font-bold mb-4">Bookings</h1>
        <p className="text-muted-foreground">Welcome back, {session.email}</p>
        <p className="text-muted-foreground">Bookings management will be built in Phase 5</p>
      </div>
    </div>
  );
}