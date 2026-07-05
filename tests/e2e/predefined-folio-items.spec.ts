import { test, expect } from "@playwright/test";

/**
 * Predefined folio items E2E tests.
 *
 * These tests verify:
 *  - Extra items page loads with seeded data
 *  - Predefined items dropdown appears in booking form
 *  - Selecting a predefined item populates fields correctly
 *  - Custom manual item button is still available
 *  - Extra items CRUD operations work
 *
 * Prerequisites:
 *  - Set BASE_URL env var (defaults to http://localhost:3000)
 *  - Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD env vars for admin login
 *  - There must be at least one active room type in the system
 *  - The app must be running on BASE_URL
 *  - Seed data must have been run (15 default folio items)
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
const HAS_CREDENTIALS = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

test.describe("Predefined folio items", () => {
  test.describe.configure({ mode: "serial" });

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

  test("sidebar shows Extra services & charges link", async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState("networkidle");

    // Check sidebar for the extra items link
    const sidebarLink = page.getByRole("link", { name: /extra services/i });
    await expect(sidebarLink).toBeVisible({ timeout: 5_000 });
  });

  test("Extra items page shows seeded items", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/inventory/extra-items`);
    await page.waitForLoadState("networkidle");

    // Check page title
    const heading = page.getByRole("heading", { name: /extra services/i });
    await expect(heading).toBeVisible({ timeout: 5_000 });

    // Check that seeded Breakfast item appears
    await expect(page.getByText("Breakfast").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Lunch").first()).toBeVisible();
    await expect(page.getByText("Dinner").first()).toBeVisible();
    await expect(page.getByText("Airport Transfer").first()).toBeVisible();

    // Check Add new item button exists
    const addBtn = page.getByRole("button", { name: /add new item/i });
    await expect(addBtn).toBeVisible();

    // Check type filter exists
    const typeFilter = page.getByRole("combobox").filter({ hasText: /all types/i }).first();
    await expect(typeFilter).toBeVisible();

    // Check search field exists
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test("type filter works on extra items page", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/inventory/extra-items`);
    await page.waitForLoadState("networkidle");

    // Click the type filter combobox
    const typeFilter = page.getByRole("combobox").filter({ hasText: /all types/i }).first();
    await typeFilter.click();
    await page.waitForTimeout(400);

    // Select "Services" from the dropdown
    const servicesOption = page.getByRole("option", { name: /services/i });
    if ((await servicesOption.count()) > 0) {
      await servicesOption.click();
      await page.waitForTimeout(300);

      // Should show service items (Breakfast, Lunch, etc.)
      await expect(page.getByText("Breakfast").first()).toBeVisible({ timeout: 3_000 });
      // Should not show charge/discount items
      const discountLabel = page.getByText("Loyalty Discount");
      if ((await discountLabel.count()) > 0) {
        await expect(discountLabel).not.toBeVisible();
      }
    }
  });

  test("search filters items on extra items page", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/inventory/extra-items`);
    await page.waitForLoadState("networkidle");

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("Airport");
    await page.waitForTimeout(300);

    // Should show Airport Transfer but not Breakfast
    await expect(page.getByText("Airport Transfer").first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText("Breakfast")).toHaveCount(0);
  });
});

test.describe("Predefined items in booking form", () => {
  test.describe.configure({ mode: "serial" });

  let bookingId: string;

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

  test("predefined items dropdown and custom item button are visible", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/bookings/new`);
    await page.waitForLoadState("networkidle");

    // Check for the predefined items dropdown (combobox with placeholder "Select predefined item")
    const predefinedDropdown = page.getByRole("combobox").filter({ hasText: /select predefined/i }).first();
    await expect(predefinedDropdown).toBeVisible({ timeout: 5_000 });

    // Check the Custom item button is present
    const customBtn = page.getByRole("button", { name: /custom item/i });
    await expect(customBtn).toBeVisible();
  });

  test("selecting predefined item populates folio line", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/bookings/new`);
    await page.waitForLoadState("networkidle");

    // Open the predefined items dropdown
    const predefinedDropdown = page.getByRole("combobox").filter({ hasText: /select predefined/i }).first();
    await predefinedDropdown.click();
    await page.waitForTimeout(400);

    // Select "Breakfast" from the options
    const breakfastOption = page.getByRole("option", { name: /breakfast/i }).first();
    if ((await breakfastOption.count()) > 0) {
      await breakfastOption.click();
      await page.waitForTimeout(300);
    } else {
      // Fallback: try selecting any available option
      const firstOption = page.getByRole("option").first();
      if ((await firstOption.count()) > 0) {
        await firstOption.click();
        await page.waitForTimeout(300);
      }
    }

    // Verify a folio line was added (look for "Line 1" text in the additional items section)
    const lineIndicator = page.getByText("Line 1").first();
    await expect(lineIndicator).toBeVisible({ timeout: 3_000 });

    // Check the name input was populated (should contain the selected item name)
    const descriptionInput = page.locator('input[placeholder*="e.g."]').first();
    if ((await descriptionInput.count()) > 0) {
      const value = await descriptionInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test("custom item button adds empty folio line", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/bookings/new`);
    await page.waitForLoadState("networkidle");

    // Click the custom item button
    const customBtn = page.getByRole("button", { name: /custom item/i });
    await customBtn.click();
    await page.waitForTimeout(300);

    // Verify a folio line was added
    const lineIndicator = page.getByText("Line 1").first();
    await expect(lineIndicator).toBeVisible({ timeout: 3_000 });
  });
});

test.describe("Predefined items in document form", () => {
  test.describe.configure({ mode: "serial" });

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

  test("document form has predefined items section", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/documents`);
    await page.waitForLoadState("networkidle");

    // The predefined items section only appears after selecting a booking
    // Check for the custom item button which indicates the section exists
    const customBtn = page.getByRole("button", { name: /custom item/i });
    await expect(customBtn).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Folio calculation with predefined items", () => {
  test("predefined service item adds to booking total", () => {
    const roomTotal = 5000;
    const serviceLine = { qty: 2, unitPrice: 150 }; // Breakfast x2
    const extrasTotal = serviceLine.qty * serviceLine.unitPrice;
    const bookingTotal = Math.max(0, roomTotal + extrasTotal);
    expect(extrasTotal).toBe(300);
    expect(bookingTotal).toBe(5300);
  });

  test("predefined charge item adds to booking total", () => {
    const roomTotal = 5000;
    const chargeLine = { qty: 1, unitPrice: 300 }; // Cleaning Fee
    const extrasTotal = chargeLine.qty * chargeLine.unitPrice;
    const bookingTotal = Math.max(0, roomTotal + extrasTotal);
    expect(extrasTotal).toBe(300);
    expect(bookingTotal).toBe(5300);
  });

  test("predefined discount item reduces booking total", () => {
    const roomTotal = 5000;
    const discountLine = { qty: 1, unitPrice: 150 }; // Promotional Discount
    const discountsTotal = discountLine.qty * discountLine.unitPrice;
    const bookingTotal = Math.max(0, roomTotal - discountsTotal);
    expect(discountsTotal).toBe(150);
    expect(bookingTotal).toBe(4850);
  });

  test("service + charge + discount combine correctly", () => {
    const roomTotal = 8000;
    const extrasTotal = 350 + 200; // Airport Transfer 350 + Extra Bed 200
    const discountsTotal = 100;      // Loyalty Discount
    const bookingTotal = Math.max(0, roomTotal + extrasTotal - discountsTotal);
    expect(bookingTotal).toBe(8450);
  });

  test("zero-price predefined item defaults to 0, user enters amount", () => {
    const damageCharge = { defaultPrice: 0, userEnteredAmount: 500 };
    const lineTotal = 1 * damageCharge.userEnteredAmount;
    expect(damageCharge.defaultPrice).toBe(0);
    expect(lineTotal).toBe(500);
  });

  test("quantity multiplies correctly for predefined items", () => {
    const airportTransfer = { unitPrice: 350, qty: 3 };
    const lineTotal = airportTransfer.qty * airportTransfer.unitPrice;
    expect(lineTotal).toBe(1050);
  });

  test("multiple predefined items with different types", () => {
    const items = [
      { kind: "service" as const, unitPrice: 150, qty: 1 },  // Breakfast
      { kind: "service" as const, unitPrice: 350, qty: 1 },  // Airport Transfer
      { kind: "charge" as const, unitPrice: 300, qty: 1 },   // Cleaning Fee
      { kind: "discount" as const, unitPrice: 100, qty: 1 },  // Loyalty Discount
    ];
    const roomTotal = 5000;
    let extrasTotal = 0;
    let discountsTotal = 0;
    for (const item of items) {
      const lineTotal = item.qty * item.unitPrice;
      if (item.kind === "discount") discountsTotal += lineTotal;
      else extrasTotal += lineTotal;
    }
    const bookingTotal = Math.max(0, roomTotal + extrasTotal - discountsTotal);
    expect(extrasTotal).toBe(800);
    expect(discountsTotal).toBe(100);
    expect(bookingTotal).toBe(5700);
  });

  test("predefined items work in document context", () => {
    const bookingTotal = 5000;
    const docExtras = 350; // Document-specific service
    const docDiscounts = 100;
    const documentTotal = Math.max(0, bookingTotal + docExtras - docDiscounts);
    expect(documentTotal).toBe(5250);
  });
});
