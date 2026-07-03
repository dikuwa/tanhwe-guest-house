import { NextRequest, NextResponse } from "next/server";
import { ilike, or } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin", "staff"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query || query.length < 2)
    return NextResponse.json([]);
  const rows = await getDb()
    .select({
      id: customers.id,
      fullName: customers.fullName,
      phone: customers.phone,
      whatsapp: customers.whatsapp,
      email: customers.email,
    })
    .from(customers)
    .where(
      or(
        ilike(customers.fullName, `%${query}%`),
        ilike(customers.phone, `%${query}%`),
        ilike(customers.whatsapp, `%${query}%`),
        ilike(customers.email, `%${query}%`)
      )
    )
    .limit(20);
  return NextResponse.json(rows);
}
