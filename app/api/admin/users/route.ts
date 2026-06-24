import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { accounts, activityLogs, users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["owner", "admin", "staff"]),
  mustChangePassword: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = getDb();
    const { name, email, password, role, mustChangePassword } = parsed.data;

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`)
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Create user with password using better-auth adapter
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    await db.transaction(async (tx) => {
      // Create user
      await tx.insert(users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        role,
      });

      // Create password account
      await tx.insert(accounts).values({
        id: crypto.randomUUID(),
        userId,
        providerId: "credential",
        accountId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Log activity
      await tx.insert(activityLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "user_created",
        entity: "user",
        entityId: userId,
        details: `${name} (${role})${mustChangePassword ? " - must change password on first login" : ""}`,
      });
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        role,
      },
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
