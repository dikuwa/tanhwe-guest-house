import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, customers } from "@/lib/db/schema";

const input = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.string().trim().min(7).max(30),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  address: z.string().trim().max(300).optional(),
  idOrPassport: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(3000).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the customer details" }, { status: 400 });
  const { id } = await params;
  const [updated] = await getDb()
    .update(customers)
    .set({
      ...parsed.data,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      idOrPassport: parsed.data.idOrPassport || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .returning({ id: customers.id });
  if (!updated) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  await getDb().insert(activityLogs).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    action: "updated",
    entity: "customer",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
