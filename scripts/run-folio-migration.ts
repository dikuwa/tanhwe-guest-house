import postgres from "postgres";
import fs from "fs";
import path from "path";

async function run() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const sql = postgres(connectionString, { max: 1 });

  try {
    const sqlContent = fs.readFileSync(
      path.resolve(process.cwd(), "drizzle/0012_folio_items.sql"),
      "utf-8"
    );
    await sql.unsafe(sqlContent);
    console.log("✓ Migration applied successfully");
  } catch (e) {
    console.error("Migration error:", e instanceof Error ? e.message : e);
  } finally {
    await sql.end();
  }
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exitCode = 1;
});
