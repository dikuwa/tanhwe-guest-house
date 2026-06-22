import { betterAuth } from "better-auth";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  secret: process.env.AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
      },
    },
    additionalFields: {
      name: {
        type: "string",
        required: true,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

export async function signInWithCredentials(
  email: string,
  password: string
) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}