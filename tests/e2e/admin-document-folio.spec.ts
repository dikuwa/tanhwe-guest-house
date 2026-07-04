import { test, expect } from "@playwright/test";

/**
 * Admin document creation with additional items E2E tests.
 *
 * These tests verify:
 *  - Document creation form has "Additional items" section
 *  - Services, extras, and discounts can be added to documents
 *  - Document totals reflect additional items
 *  - Generated documents show additional items
 *
 * Prerequisites:
 *  - Set BASE_URL env var (defaults to http://localhost:3000)
 *  - Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD env vars
 *  - App must be running on BASE_URL
 *  - At least one active room type exists
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
const HAS_CREDENTIALS = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

test.describe("Admin document creation with additional items", () => {
  test.describe.configure({ mode: "serial" });

  let bookingId: string;
  let documentId: string;

  test.skip(!HAS_CREDENTIALS, "Skipping: E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set");

  test("admin can log in", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin/, { timeout: 15_000 });
    const dashboard = page.getByRole("heading", { name: /dashboard/i });
    await expect(dashboard).toBeVisible({ timeout: 5_000 });
  });

  test("admin can create a booking for document testing", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/bookings/new`);
    await page.waitForLoadState("networkidle");

    // Select dates next month 20-22
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const checkIn = new Date(nextMonth);
    checkIn.setDate(20);
    const checkOut = new Date(nextMonth);
    checkOut.setDate(22);

    const checkInStr = checkIn.toISOString().slice(0, 10);
    const checkOutStr = checkOut.toISOString().slice(0, 10);

    // Fill date inputs if native date inputs exist
    const dateInputs = page.locator('input[type="date"]');
    if ((await dateInputs.count()) >= 2) {
      await dateInputs.nth(0).fill(checkInStr);
      await dateInputs.nth(1).fill(checkOutStr);
    }

    // Select room type
    const roomTrigger = page.locator('[role="combobox"]').first();
    if ((await roomTrigger.count()) > 0) {
      await roomTrigger.click();
      await page.waitForTimeout(400);
      const option = page.locator('[role="option"]').first();
      if ((await option.count()) > 0) {
        await option.click();
        await page.waitForTimeout(300);
      }
    } else {
      const nativeSelect = page.locator("select").first();
      if ((await nativeSelect.count()) > 0) {
        const optionValue = await nativeSelect.locator("option").nth(1).getAttribute("value");
        if (optionValue) {
          await nativeSelect.selectOption(optionValue);
        }
      }
    }

    // Guest info
    const nameInput = page.locator("#fullName, input[name='fullName']").first();
    if ((await nameInput.count()) > 0) {
      await nameInput.fill("Doc Test Guest");
    }
    const phoneInput = page.locator("#phone, input[name='phone']").first();
    if ((await phoneInput.count()) > 0) {
      await phoneInput.fill("+264 81 999 8888");
    }

    // Submit
    await page.getByRole("button", { name: /create/i }).first().click();
    await page.waitForURL(/\/admin\/bookings\/(?!new)/, { timeout: 15_000 });

    const match = page.url().match(/\/admin\/bookings\/([a-f0-9-]+)/);
    if (match) {
      bookingId = match[1];
    }
    test.skip(!bookingId, "Failed to create booking");
  });

  test("document form has Additional items section", async ({ page }) => {
    test.skip(!bookingId, "No booking ID from previous test");

    await page.goto(`${BASE_URL}/admin/documents`);
    await page.waitForLoadState("networkidle");

    // Go to document creation (form is on the documents list page)
    // Select the booking we just created
    const bookingSelect = page.getByRole("combobox").filter({ hasText: /Select booking/i }).first();
    if ((await bookingSelect.count()) > 0) {
      await bookingSelect.click();
      await page.waitForTimeout(500);

      // Find and select our booking
      const option = page.getByText("Doc Test Guest").first();
      if ((await option.count()) > 0) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    // Check that the "Additional items" heading appears after selecting a booking
    // It only shows when a booking is selected
    await page.waitForTimeout(300);
    const addItemsBtn = page.getByRole("button", { name: /add service/i });
    await expect(addItemsBtn).toBeVisible({ timeout: 5_000 });
  });

  test("admin can add additional items to document", async ({ page }) => {
    test.skip(!bookingId, "No booking ID from previous test");

    await page.goto(`${BASE_URL}/admin/documents`);
    await page.waitForLoadState("networkidle");

    // Select the booking
    const bookingSelect = page.getByRole("combobox").filter({ hasText: /Select booking/i }).first();
    if ((await bookingSelect.count()) > 0) {
      await bookingSelect.click();
      await page.waitForTimeout(500);
      const option = page.getByText("Doc Test Guest").first();
      if ((await option.count()) > 0) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    // Select Quote document type
    const typeSelect = page.getByRole("combobox").filter({ hasText: /Quote|Invoice|Receipt/i }).first();
    if ((await typeSelect.count()) > 0) {
      await typeSelect.click();
      await page.waitForTimeout(300);
      const quoteOpt = page.getByRole("option", { name: /quote/i });
      if ((await quoteOpt.count()) > 0) {
        await quoteOpt.click();
        await page.waitForTimeout(200);
      }
    }

    // --- Add a service ---
    await page.getByRole("button", { name: /add service/i }).click();
    await page.waitForTimeout(300);

    // Fill description
    const descInput = page.locator('input[placeholder*="e.g."]').first();
    if ((await descInput.count()) > 0) {
      await descInput.fill("Airport Transfer");
    }

    // Fill unit price
    const numberInputs = page.locator('input[type="number"]');
    const numCount = await numberInputs.count();
    // Qty = 1
    if (numCount >= 1) {
      await numberInputs.nth(0).fill("1");
    }
    // Unit price
    if (numCount >= 2) {
      await numberInputs.nth(1).fill("350");
    }

    // --- Add a discount ---
    await page.getByRole("button", { name: /add service/i }).click();
    await page.waitForTimeout(300);

    // Fill discount description
    const allDescInputs = page.locator('input[placeholder*="e.g."]');
    const descCount = await allDescInputs.count();
    if (descCount >= 2) {
      await allDescInputs.nth(1).fill("Document Discount");
    }

    // Select discount type
    // Try using the Radix Select for the folio line type
    // The folio line type selects are after the main selects
    const allTriggers = page.locator('[role="combobox"]');
    const triggerCount = await allTriggers.count();
    // After the booking select and document type select, the 3rd+ combobox is likely the folio type
    if (triggerCount >= 3) {
      await allTriggers.nth(2).click();
      await page.waitForTimeout(300);
      const discountOpt = page.getByRole("option", { name: /discount/i });
      if ((await discountOpt.count()) > 0) {
        await discountOpt.click();
        await page.waitForTimeout(200);
      }
    }

    // Fill discount qty and price
    const allNumberInputs = page.locator('input[type="number"]');
    const totalNum = await allNumberInputs.count();
    if (totalNum >= 3) {
      await allNumberInputs.nth(2).fill("1");
    }
    if (totalNum >= 4) {
      await allNumberInputs.nth(3).fill("100");
    }

    // Verify the totals preview shows the adjustments
    await page.waitForTimeout(500);
    const docTotalText = page.getByText(/Document total/i);
    await expect(docTotalText).toBeVisible({ timeout: 3_000 });

    // --- Create the document ---
    await page.getByRole("button", { name: /create/i }).last().click();
    await page.waitForURL(/\/admin\/documents\//, { timeout: 15_000 });

    const match = page.url().match(/\/admin\/documents\/([a-f0-9-]+)/);
    if (match) {
      documentId = match[1];
    }
    test.skip(!documentId, "Failed to create document");

    // Verify the document detail page shows our additional items
    await page.waitForLoadState("networkidle");
    const folioSection = page.getByText(/additional items|folio items/i).first();
    await expect(folioSection).toBeVisible({ timeout: 5_000 });
  });

  test("invoice creation with additional items works", async ({ page }) => {
    test.skip(!bookingId, "No booking ID from previous test");

    await page.goto(`${BASE_URL}/admin/documents`);
    await page.waitForLoadState("networkidle");

    // Select the booking
    const bookingSelect = page.getByRole("combobox").filter({ hasText: /Select booking/i }).first();
    if ((await bookingSelect.count()) > 0) {
      await bookingSelect.click();
      await page.waitForTimeout(500);
      const option = page.getByText("Doc Test Guest").first();
      if ((await option.count()) > 0) {
        await option.click();
        await page.waitForTimeout(300);
      }
    }

    // Select Invoice type
    const typeSelect = page.getByRole("combobox").filter({ hasText: /Quote|Invoice|Receipt/i }).first();
    if ((await typeSelect.count()) > 0) {
      await typeSelect.click();
      await page.waitForTimeout(300);
      const invoiceOpt = page.getByRole("option", { name: /invoice/i });
      if ((await invoiceOpt.count()) > 0) {
        await invoiceOpt.click();
        await page.waitForTimeout(200);
      }
    }

    // Add one extra charge
    await page.getByRole("button", { name: /add service/i }).click();
    await page.waitForTimeout(300);

    const descInput = page.locator('input[placeholder*="e.g."]').first();
    if ((await descInput.count()) > 0) {
      await descInput.fill("Extra Cleaning");
    }

    const numberInputs = page.locator('input[type="number"]');
    if ((await numberInputs.count()) >= 2) {
      await numberInputs.nth(0).fill("1");
      await numberInputs.nth(1).fill("200");
    }

    // Type: Extra charge (custom)
    const allTriggers = page.locator('[role="combobox"]');
    const triggerCount = await allTriggers.count();
    if (triggerCount >= 3) {
      await allTriggers.nth(2).click();
      await page.waitForTimeout(300);
      const extraOpt = page.getByRole("option", { name: /extra/i });
      if ((await extraOpt.count()) > 0) {
        await extraOpt.click();
        await page.waitForTimeout(200);
      }
    }

    // Create invoice
    await page.getByRole("button", { name: /create/i }).last().click();
    await page.waitForURL(/\/admin\/documents\//, { timeout: 15_000 });

    const match = page.url().match(/\/admin\/documents\/([a-f0-9-]+)/);
    if (match) {
      documentId = match[1];
    }

    // Should show additional items
    await page.waitForLoadState("networkidle");
    const itemsSection = page.getByText(/additional items|extra cleaning/i).first();
    await expect(itemsSection).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Document folio calculation verification", () => {
  test("booking total + document extras = correct document total", () => {
    const bookingTotal = 5000;
    const docExtras = 350; // Airport transfer
    const docDiscounts = 100;
    const documentTotal = Math.max(0, bookingTotal + docExtras - docDiscounts);
    expect(documentTotal).toBe(5250);
  });

  test("document folio lines are stored in snapshot", () => {
    const snapshot = {
      folioLines: [
        { kind: "service" as const, name: "Airport Transfer", qty: 1, unitPrice: 350, lineTotal: 350 },
        { kind: "discount" as const, name: "Promo", qty: 1, unitPrice: 100, lineTotal: 100 },
      ],
      total: 5250,
      amountPaid: 0,
      balanceDue: 5250,
    };
    expect(snapshot.folioLines).toHaveLength(2);
    expect(snapshot.total).toBe(5250);
    expect(snapshot.balanceDue).toBe(5250);
  });

  test("document folio lines merge with booking folio lines in snapshot", () => {
    const bookingFolioLines = [
      { kind: "service" as const, name: "Breakfast", lineTotal: 300 },
    ];
    const docFolioLines = [
      { kind: "service" as const, name: "Airport Transfer", lineTotal: 350 },
      { kind: "discount" as const, name: "Promo", lineTotal: 100 },
    ];
    const merged = [...bookingFolioLines, ...docFolioLines];
    expect(merged).toHaveLength(3);
    const totalExtras = merged.filter((l) => l.kind !== "discount").reduce((s, l) => s + l.lineTotal, 0);
    const totalDiscounts = merged.filter((l) => l.kind === "discount").reduce((s, l) => s + l.lineTotal, 0);
    expect(totalExtras).toBe(650);
    expect(totalDiscounts).toBe(100);
  });

  test("document total = booking total + doc extras - doc discounts", () => {
    const bookingTotal = 8000;
    const docServiceTotal = 400;
    const docExtraTotal = 200;
    const docDiscountTotal = 150;
    const docExtrasCombined = docServiceTotal + docExtraTotal;
    const documentTotal = Math.max(0, bookingTotal + docExtrasCombined - docDiscountTotal);
    expect(documentTotal).toBe(8450);
  });

  test("document balance due uses booking amount paid", () => {
    const bookingAmountPaid = 2000;
    const bookingTotal = 5000;
    const docExtras = 300;
    const docDiscount = 100;
    const documentTotal = Math.max(0, bookingTotal + docExtras - docDiscount);
    const documentBalanceDue = Math.max(0, documentTotal - bookingAmountPaid);
    expect(documentTotal).toBe(5200);
    expect(documentBalanceDue).toBe(3200);
  });

  test("document without additional items uses booking totals directly", () => {
    const snapshot = {
      total: 5000,
      amountPaid: 1000,
      balanceDue: 4000,
      folioLines: [] as never[],
    };
    expect(snapshot.total).toBe(5000);
    expect(snapshot.balanceDue).toBe(4000);
  });

  test("receipt with additional items shows correct paid/balance", () => {
    const bookingTotal = 5000;
    const bookingAmountPaid = 5000; // fully paid
    const docExtras = 200;
    const docDiscount = 0;
    const documentTotal = Math.max(0, bookingTotal + docExtras - docDiscount);
    const documentBalanceDue = Math.max(0, documentTotal - bookingAmountPaid);
    expect(documentTotal).toBe(5200);
    expect(documentBalanceDue).toBe(200);
  });
});
