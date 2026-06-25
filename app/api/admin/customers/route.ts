import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { or, sql } from "drizzle-orm";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, customers } from "@/lib/db/schema";

const input = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.string().trim().min(7).max(30),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  address: z.string().trim().max(300).optional(),
  idOrPassport: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(3000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the customer details" }, { status: 400 });

  // Check for existing customers with same phone or email
  const normalizedPhone = sql<string>`regexp_replace(${customers.phone}, '[^0-9]', '', 'g')`;
  const normalizedWhatsapp = sql<string>`regexp_replace(${customers.whatsapp}, '[^0-9]', '', 'g')`;
  const identityPhone = parsed.data.phone.replace(/\D/g, "");
  const identityWhatsapp = parsed.data.whatsapp.replace(/\D/g, "");
  const identityEmail = parsed.data.email?.trim().toLowerCase();

  const existing = await getDb()
    .select({ id: customers.id, fullName: customers.fullName })
    .from(customers)
    .where(
      or(
        sql`${normalizedPhone} = ${identityPhone}`,
        sql`${normalizedWhatsapp} = ${identityWhatsapp}`,
        ...(identityEmail ? [sql`lower(${customers.email}) = ${identityEmail}`] : [])
      )
    )
    .limit(5);

  if (existing.length > 0) {
    return NextResponse.json(
      {
        error: "Possible duplicate customer found",
        duplicates: existing.map((c) => ({ id: c.id, name: c.fullName })),
      },
      { status: 409 }
    );
  }

  const id = crypto.randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.insert(customers).values({
      id,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      idOrPassport: parsed.data.idOrPassport || null,
      notes: parsed.data.notes || null,
    });
    await tx.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "created",
      entity: "customer",
      entityId: id,
      details: parsed.data.fullName,
    });
  });

  return NextResponse.json({ id }, { status: 201 });
}
