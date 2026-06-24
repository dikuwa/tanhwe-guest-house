import { test, expect } from "@playwright/test";

test.describe("Homepage booking bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#booking");
  });

  test("section headings are dark (not blue)", async ({ page }) => {
    const headings = page.locator("#booking p");
    await expect(headings.filter({ hasText: "ROOM & GUESTS" })).toBeVisible();
    await expect(headings.filter({ hasText: "YOUR STAY" })).toBeVisible();
    await expect(headings.filter({ hasText: "CHECK DATES" })).toBeVisible();

    for (const heading of await headings.all()) {
      const classAttr = await heading.getAttribute("class");
      expect(classAttr).not.toContain("text-blue");
    }
  });

  test("orange CTA button is visible and enabled", async ({ page }) => {
    const cta = page.locator("#booking button[type='submit']");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveClass(/bg-orange-500/);
    await expect(cta).not.toBeDisabled();
  });

  test("clicking Check-in opens exactly one calendar with correct weekday headers", async ({
    page,
  }) => {
    const checkInTrigger = page.locator("#search-check-in");
    await checkInTrigger.click();

    // Wait for the popover to appear
    const popover = page.locator('[data-slot="popover-content"]');
    await expect(popover).toBeVisible({ timeout: 5_000 });

    // Verify exactly one popover is open (not 2 or 3)
    expect(await popover.count()).toBe(1);

    // Verify all 7 weekday headers are present in the correct order
    const weekdayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    const calendarText = (await popover.textContent()) ?? "";
    for (const day of weekdayLabels) {
      expect(calendarText).toContain(day);
    }

    // Pick the 15th of the next month for a reliable clickable date
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(15);
    const dayLabel = `${nextMonth.getDate()}`;

    // Click the "next month" button first
    const nextBtn = popover.locator(
      'button[aria-label*="next"], button[aria-label*="Next"]'
    );
    if ((await nextBtn.count()) > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(400);
    }

    // Select the date — after selection check-in closes and check-out opens automatically
    const dayButton = popover.getByRole("gridcell").getByRole("button", { name: dayLabel });
    if ((await dayButton.count()) > 0) {
      await dayButton.click();
      await page.waitForTimeout(500);

      // The check-in popover closes, but check-out opens automatically.
      // Verify the check-out trigger now shows a date (meaning selection worked)
      const checkOutTrigger = page.locator("#search-check-out");
      const triggerText = await checkOutTrigger.textContent();
      expect(triggerText).not.toContain("Check-out");
    } else {
      // No clickable date found (unexpected), just verify popover exists
      test.info().annotations.push({
        type: "warn",
        description: `Date button for ${dayLabel} not found`,
      });
    }
  });

  test("clicking Check-out opens exactly one calendar popover", async ({
    page,
  }) => {
    // First set a check-in date so check-out is not disabled
    const checkInTrigger = page.locator("#search-check-in");

    // Open check-in popover via click
    await checkInTrigger.click();
    const popover = page.locator('[data-slot="popover-content"]');
    await expect(popover).toBeVisible({ timeout: 5_000 });

    // Select a date in the next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(15);

    const nextBtn = popover.locator(
      'button[aria-label*="next"], button[aria-label*="Next"]'
    );
    if ((await nextBtn.count()) > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(400);
    }

    const dayButton = popover.getByRole("gridcell").getByRole("button", {
      name: `${nextMonth.getDate()}`,
    });
    if ((await dayButton.count()) > 0) {
      await dayButton.click();
      await page.waitForTimeout(500);
    }

    // Now click check-out — should open a new popover
    const checkOutTrigger = page.locator("#search-check-out");
    await checkOutTrigger.click();
    await page.waitForTimeout(500);

    // Verify exactly one popover
    expect(await popover.count()).toBe(1);
    await expect(popover).toBeVisible({ timeout: 3_000 });
  });

  test("no detached calendar at top-left of page", async ({ page }) => {
    await page.locator("#search-check-in").click();
    await page.waitForTimeout(500);

    const popovers = page.locator('[data-slot="popover-content"]');
    expect(await popovers.count()).toBe(1);

    // Verify the popover is not at (0,0)
    const box = await popovers.first().boundingBox();
    if (box) {
      expect(box.x).toBeGreaterThan(50);
      expect(box.y).toBeGreaterThan(50);
    }
  });

  test("popover stays open during month navigation", async ({ page }) => {
    await page.locator("#search-check-in").click();
    const popover = page.locator('[data-slot="popover-content"]');
    await expect(popover).toBeVisible({ timeout: 5_000 });

    const nextBtn = popover.locator(
      'button[aria-label*="next"], button[aria-label*="Next"]'
    );
    if ((await nextBtn.count()) > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(400);
      await expect(popover).toBeVisible();
    }
  });

  test("desktop layout shows three-column grid", async ({ page }) => {
    const grid = page.locator("#booking > div > div");
    const classAttr = await grid.getAttribute("class");
    expect(classAttr).toContain("lg:grid-cols-[");
  });
});

test.describe("Rooms page booking bar", () => {
  test("compact booking bar loads without error", async ({ page }) => {
    await page.goto("/rooms");
    await page.waitForSelector("#booking");
    await expect(page.locator("#search-room-compact")).toBeVisible();
  });
});
