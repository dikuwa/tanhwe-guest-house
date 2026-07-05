import postgres from "postgres";

async function run() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const sql = postgres(connectionString, { max: 1 });

  const defaultItems = [
    { name: "Breakfast", item_type: "service", category: "Food & Beverage", default_price: 150, sort_order: 1, description: null },
    { name: "Lunch", item_type: "service", category: "Food & Beverage", default_price: 180, sort_order: 2, description: null },
    { name: "Dinner", item_type: "service", category: "Food & Beverage", default_price: 220, sort_order: 3, description: null },
    { name: "Airport Transfer", item_type: "service", category: "Transport", default_price: 350, sort_order: 4, description: null },
    { name: "Laundry Service", item_type: "service", category: "Housekeeping", default_price: 120, sort_order: 5, description: null },
    { name: "Extra Bed", item_type: "service", category: "Accommodation", default_price: 200, sort_order: 6, description: null },
    { name: "Late Check-out", item_type: "service", category: "Accommodation", default_price: 250, sort_order: 7, description: null },
    { name: "Early Check-in", item_type: "service", category: "Accommodation", default_price: 250, sort_order: 8, description: null },
    { name: "Cleaning Fee", item_type: "charge", category: "Housekeeping", default_price: 300, sort_order: 9, description: null },
    { name: "Damage Charge", item_type: "charge", category: "Miscellaneous", default_price: 0, sort_order: 10, description: "Variable amount based on damage assessment" },
    { name: "Incidental Charge", item_type: "charge", category: "Miscellaneous", default_price: 0, sort_order: 11, description: "Variable incidental charges" },
    { name: "Loyalty Discount", item_type: "discount", category: "Discounts", default_price: 100, sort_order: 12, description: null },
    { name: "Promotional Discount", item_type: "discount", category: "Discounts", default_price: 150, sort_order: 13, description: null },
    { name: "Manual Discount", item_type: "discount", category: "Discounts", default_price: 0, sort_order: 14, description: "Custom discount — enter the amount" },
    { name: "Other / Custom Item", item_type: "service", category: "Other", default_price: 0, sort_order: 15, description: "Custom item — enter description and amount" },
  ];

  let count = 0;
  for (const item of defaultItems) {
    const existing = await sql`
      SELECT id FROM folio_items WHERE name = ${item.name} LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO folio_items (id, name, item_type, category, default_price, description, status, sort_order)
        VALUES (${crypto.randomUUID()}, ${item.name}, ${item.item_type}, ${item.category}, ${item.default_price}, ${item.description}, 'active', ${item.sort_order})
      `;
      count++;
    }
  }

  console.log(`✓ Seeded ${count} folio items (${defaultItems.length - count} already existed)`);
  await sql.end();
}

run().catch((e) => {
  console.error("Seed failed:", e);
  process.exitCode = 1;
});
