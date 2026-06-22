import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "../lib/db";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function runMigrations() {
  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error("Error running migrations:", error);
  process.exit(1);
});