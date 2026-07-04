/**
 * One-time safe script to ensure the booking_folio_lines table exists on production.
 *
 * Uses CREATE TABLE IF NOT EXISTS so it's safe to run even if the table already exists.
 * Run: npx tsx --env-file=.env scripts/ensure-folio-table.ts
 */
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required");

  const sql = postgres(connectionString, { max: 1 });

  try {
    const result = await sql`
      CREATE TABLE IF NOT EXISTS booking_folio_lines (
        id text PRIMARY KEY NOT NULL,
        booking_id text NOT NULL,
        kind text NOT NULL,
        name text NOT NULL,
        description text,
        qty integer DEFAULT 1 NOT NULL,
        unit_price integer DEFAULT 0 NOT NULL,
        line_total integer DEFAULT 0 NOT NULL,
        sort_order integer DEFAULT 0 NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log("✓ booking_folio_lines table ensured");

    // Add FK, indexes, and constraints safely
    // Note: We use individual try/catch for each operation so one failure doesn't block the rest
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'booking_folio_lines_booking_id_bookings_id_fk'
          ) THEN
            EXECUTE 'ALTER TABLE booking_folio_lines ADD CONSTRAINT booking_folio_lines_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE';
          END IF;
        END
        $$;
      `;
      console.log("✓ FK constraint ensured");
    } catch (e) {
      console.log("⚠ FK constraint skipped (may already exist):", (e as Error).message);
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS booking_folio_lines_booking_id_idx ON booking_folio_lines(booking_id)`;
      console.log("✓ booking_id index ensured");
    } catch (e) {
      console.log("⚠ booking_id index skipped:", (e as Error).message);
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS booking_folio_lines_kind_idx ON booking_folio_lines(kind)`;
      console.log("✓ kind index ensured");
    } catch (e) {
      console.log("⚠ kind index skipped:", (e as Error).message);
    }

    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_folio_lines_qty_positive') THEN
            EXECUTE 'ALTER TABLE booking_folio_lines ADD CONSTRAINT booking_folio_lines_qty_positive CHECK (qty >= 1)';
          END IF;
        END
        $$;
      `;
      console.log("✓ qty_positive constraint ensured");
    } catch (e) {
      console.log("⚠ qty constraint skipped:", (e as Error).message);
    }

    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_folio_lines_unit_price_nonnegative') THEN
            EXECUTE 'ALTER TABLE booking_folio_lines ADD CONSTRAINT booking_folio_lines_unit_price_nonnegative CHECK (unit_price >= 0)';
          END IF;
        END
        $$;
      `;
      console.log("✓ unit_price constraint ensured");
    } catch (e) {
      console.log("⚠ unit_price constraint skipped:", (e as Error).message);
    }

    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_folio_lines_line_total_nonnegative') THEN
            EXECUTE 'ALTER TABLE booking_folio_lines ADD CONSTRAINT booking_folio_lines_line_total_nonnegative CHECK (line_total >= 0)';
          END IF;
        END
        $$;
      `;
      console.log("✓ line_total constraint ensured");
    } catch (e) {
      console.log("⚠ line_total constraint skipped:", (e as Error).message);
    }

    const tableCheck = await sql`SELECT count(*)::int AS cnt FROM booking_folio_lines LIMIT 1`;
    console.log(`✓ booking_folio_lines table has ${tableCheck[0].cnt} rows`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exitCode = 1;
});
