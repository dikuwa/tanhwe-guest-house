import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function runMigrations() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required");

  const client = postgres(connectionString, { max: 1, prepare: false });
  const migrationDb = drizzle(client);

  console.log("Running migrations...");
  try {
    await migrate(migrationDb, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully!");
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
