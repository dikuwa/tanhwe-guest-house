import "server-only";
import { or, sql } from "drizzle-orm";
import { customerIdentity } from "./customer-matching";
import { getDb } from "./db";
import { customers } from "./db/schema";

export async function findConfidentCustomerMatch(input: {
  phone: string;
  whatsapp: string;
  email?: string | null;
}) {
  const identity = customerIdentity(input);
  const normalizedPhone = sql<string>`regexp_replace(${customers.phone}, '[^0-9]', '', 'g')`;
  const normalizedWhatsapp = sql<string>`regexp_replace(${customers.whatsapp}, '[^0-9]', '', 'g')`;
  const candidates = await getDb()
    .select()
    .from(customers)
    .where(
      or(
        sql`${normalizedPhone} = ${identity.phone}`,
        sql`${normalizedWhatsapp} = ${identity.whatsapp}`,
        ...(identity.email ? [sql`lower(${customers.email}) = ${identity.email}`] : [])
      )
    )
    .limit(10);
  const scored = candidates
    .map((candidate) => {
      const candidateIdentity = customerIdentity(candidate);
      const matches = [
        identity.phone && candidateIdentity.phone === identity.phone,
        identity.whatsapp && candidateIdentity.whatsapp === identity.whatsapp,
        identity.email && candidateIdentity.email === identity.email,
      ].filter(Boolean).length;
      return { candidate, matches };
    })
    .filter((value) => value.matches >= 2)
    .sort((a, b) => b.matches - a.matches);
  if (scored.length !== 1 || scored[0].matches === scored[1]?.matches) return null;
  return scored[0].candidate;
}
