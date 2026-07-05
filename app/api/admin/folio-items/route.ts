import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, folioItems } from "@/lib/db/schema";

const itemInput = z.object({
  name: z.string().trim().min(1).max(200),
  itemType: z.enum(["service", "charge", "discount"]),
  category: z.string().trim().min(1).max(100).default("Other"),
  defaultPrice: z.coerce.number().int().min(0).max(100_000_000).default(0),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export async function GET() {
  const items = await getDb()
    .select()
    .from(folioItems)
    .orderBy(asc(folioItems.sortOrder), asc(folioItems.name));
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner", "admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = itemInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Please check the item details" }, { status: 400 });

  const db = getDb();

  // Check for duplicate name
  const existing = await db.query.folioItems.findFirst({
    where: eq(folioItems.name, parsed.data.name),
  });
  if (existing)
    return NextResponse.json(
      { error: `Item "${parsed.data.name}" already exists` },
      { status: 409 }
    );

  const id = crypto.randomUUID();
  try {
    await db.insert(folioItems).values({
      id,
      name: parsed.data.name,
      itemType: parsed.data.itemType,
      category: parsed.data.category,
      defaultPrice: parsed.data.defaultPrice,
      description: parsed.data.description || null,
      status: parsed.data.status,
      sortOrder: parsed.data.sortOrder,
    });

    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "created",
      entity: "folio_item",
      entityId: id,
      details: parsed.data.name,
    });

    return NextResponse.json({ id, name: parsed.data.name }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}
