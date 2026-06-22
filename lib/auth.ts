import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "./db/schema";

export const roles = ["owner", "admin", "staff"] as const;
export type Role = (typeof roles)[number];

function createAuth() {
  const secret = process.env.AUTH_SECRET;
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  if (!baseURL) throw new Error("NEXT_PUBLIC_SITE_URL is required");

  return betterAuth({
    baseURL,
    trustedOrigins: [baseURL],
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        ...schema,
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    secret,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    user: {
      modelName: "user",
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "staff",
          input: false,
        },
      },
    },
    advanced: {
      cookiePrefix: "tanhwe",
      useSecureCookies: process.env.NODE_ENV === "production",
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 10,
    },
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}

export type AuthSession = Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>;
