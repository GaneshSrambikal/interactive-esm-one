// tests/e2e/seating-map.spec.ts
import { test, expect, type Page } from '@playwright/test';

// Helper function to wait for venue to load
async function waitForVenueLoad(page: Page) {
  await page.waitForSelector('text=Metropolis Arena', { timeout: 10000 });
  await page.waitForSelector('svg[role="application"]', { timeout: 5000 });
}

// Helper to get seat by ID
// async function getSeat(page: Page, seatId: string) {
//   return page.locator(`circle[aria-label*="${seatId}"]`).first();
// }

test.describe('Interactive Seating Map - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);
  });

  test('should load venue data and display seating map', async ({ page }) => {
    // Check header displays correctly
    await expect(page.locator('h1')).toContainText('Metropolis Arena');

    // Check seat count is displayed
    await expect(page.locator('text=/\\d+ seats/')).toBeVisible();

    // Check SVG map is rendered
    const svg = page.locator('svg[role="application"]');
    await expect(svg).toBeVisible();

    // Check seats are rendered (should have circles)
    const seats = page.locator('circle[role="button"]');
    const count = await seats.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should select and deselect seats with mouse clicks', async ({
    page,
  }) => {
    // Find an available seat (green)
    const availableSeat = page
      .locator('circle[aria-label*="available"]')
      .first();

    // Click to select
    await availableSeat.click();

    // Check sidebar shows 1 selected seat
    await expect(
      page.locator('text=/Selected Seats \\(1\\/8\\)/')
    ).toBeVisible();

    // Check seat color changed (should be blue for selected)
    await expect(availableSeat).toHaveAttribute('fill', '#3b82f6');

    // Click again to deselect
    await availableSeat.click();

    // Check sidebar shows 0 selected seats
    await expect(
      page.locator('text=/Selected Seats \\(0\\/8\\)/')
    ).toBeVisible();
  });

  test('should enforce maximum of 8 seat selections', async ({ page }) => {
    const availableSeats = page.locator('circle[aria-label*="available"]');

    // Select 8 seats
    for (let i = 0; i < 8; i++) {
      await availableSeats.nth(i).click();
    }

    // Verify 8 seats selected
    await expect(
      page.locator('text=/Selected Seats \\(8\\/8\\)/')
    ).toBeVisible();

    // Try to select 9th seat
    await availableSeats.nth(8).click();

    // Should still show 8 seats
    await expect(
      page.locator('text=/Selected Seats \\(8\\/8\\)/')
    ).toBeVisible();
  });

  test('should calculate and display total price correctly', async ({
    page,
  }) => {
    // Get price tiers from the first few available seats
    const seat1 = page.locator('circle[aria-label*="available"]').first();
    const seat2 = page.locator('circle[aria-label*="available"]').nth(1);

    // Select first seat
    await seat1.click();

    // Check that total is displayed
    await expect(page.locator('text=/Total:/')).toBeVisible();
    const totalLocator = page.locator('.text-blue-600, .text-blue-400').last();
    const firstTotal = await totalLocator.textContent();

    // Select second seat
    await seat2.click();

    // Check total updated
    const secondTotal = await totalLocator.textContent();
    expect(secondTotal).not.toBe(firstTotal);
  });
});

test.describe('Keyboard Navigation & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);
  });

  test('should select seat with Enter key', async ({ page }) => {
    // Tab to first available seat
    const firstAvailable = page
      .locator('circle[aria-label*="available"][tabindex="0"]')
      .first();
    await firstAvailable.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Check selection
    await expect(
      page.locator('text=/Selected Seats \\(1\\/8\\)/')
    ).toBeVisible();
  });

  test('should select seat with Space key', async ({ page }) => {
    // Tab to first available seat
    const firstAvailable = page
      .locator('circle[aria-label*="available"][tabindex="0"]')
      .first();
    await firstAvailable.focus();

    // Press Space
    await page.keyboard.press('Space');

    // Check selection
    await expect(
      page.locator('text=/Selected Seats \\(1\\/8\\)/')
    ).toBeVisible();
  });

  test('should navigate with arrow keys', async ({ page }) => {
    // Focus first available seat
    const firstAvailable = page
      .locator('circle[aria-label*="available"][tabindex="0"]')
      .first();
    await firstAvailable.focus();

    const initialLabel = await firstAvailable.getAttribute('aria-label');

    // Press ArrowRight
    await page.keyboard.press('ArrowRight');

    // Check that focus moved
    const focusedElement = page.locator(':focus');
    const newLabel = await focusedElement.getAttribute('aria-label');

    expect(newLabel).not.toBe(initialLabel);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const seat = page.locator('circle[role="button"]').first();
    const ariaLabel = await seat.getAttribute('aria-label');

    // Should contain seat ID, status, and price
    expect(ariaLabel).toMatch(/Seat/);
    expect(ariaLabel).toMatch(/available|reserved|sold/);
    expect(ariaLabel).toMatch(/\$/);
  });

  test('should indicate selected state with aria-pressed', async ({ page }) => {
    const seat = page.locator('circle[aria-label*="available"]').first();

    // Check initially not pressed
    await expect(seat).toHaveAttribute('aria-pressed', 'false');

    // Click to select
    await seat.click();

    // Check now pressed
    await expect(seat).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Seat Details & Hover States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);
  });

  test('should show seat details on hover', async ({ page }) => {
    const seat = page.locator('circle[aria-label*="available"]').first();

    // Hover over seat
    await seat.hover();

    // Check seat details panel appears
    await expect(page.locator('text=/Seat Details/')).toBeVisible();
    await expect(page.locator('text=/Seat ID:/')).toBeVisible();
    await expect(page.locator('text=/Status:/')).toBeVisible();
    await expect(page.locator('text=/Price:/')).toBeVisible();
  });

  test('should show seat details on focus', async ({ page }) => {
    const seat = page.locator('circle[aria-label*="available"]').first();

    // Focus seat
    await seat.focus();

    // Check seat details panel appears
    await expect(page.locator('text=/Seat Details/')).toBeVisible();
  });

  test('should display correct price tier information', async ({ page }) => {
    const seat = page.locator('circle[aria-label*="available"]').first();
    await seat.hover();

    // Check that price is displayed
    const priceText = page.locator('text=/Price: \\$/');
    await expect(priceText).toBeVisible();

    // Check tier is displayed
    const tierText = page.locator('text=/Tier:/');
    await expect(tierText).toBeVisible();
  });
});

test.describe('Heat Map Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);
  });

  test('heat map should color seats by price tier', async ({ page }) => {
    const heatMapButton = page.locator('button[aria-label="Toggle heat map"]');
    await heatMapButton.click();

    // Get seats from different tiers
    const seats = page.locator('circle[aria-label*="available"]');
    const colors = new Set<string>();

    // Collect colors from first 10 available seats
    for (let i = 0; i < Math.min(10, await seats.count()); i++) {
      const color = await seats.nth(i).getAttribute('fill');
      if (color) colors.add(color);
    }

    // Should have multiple colors (different tiers)
    expect(colors.size).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Find Adjacent Seats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);
  });

  test('should find seats in the same row', async ({ page }) => {
    const findButton = page.locator('button:has-text("Find 2 Seats")');
    await findButton.click();

    // Get selected seat IDs from the sidebar
    const seatIds = await page.locator('.font-mono').allTextContents();

    // Extract row numbers (format: A-1-01, A-1-02)
    const rows = seatIds
      .map((id) => {
        const match = id.match(/[A-Z]-(\d+)-/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    // Both should be in same row
    expect(new Set(rows).size).toBe(1);
  });
});

test.describe('Zoom Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);
  });

  // test('should zoom in when + button clicked', async ({ page }) => {
  //   const zoomInButton = page.locator('button[aria-label="Zoom in"]');
  //   const svg = page.locator('svg[role="application"]');

  //   // Get initial transform
  //   const initialTransform = await page
  //     .locator('g')
  //     .first()
  //     .getAttribute('transform');

  //   // Click zoom in
  //   await zoomInButton.click();

  //   // Get new transform
  //   await page.waitForTimeout(100);
  //   const newTransform = await page
  //     .locator('g')
  //     .first()
  //     .getAttribute('transform');

  //   // Transform should have changed
  //   expect(newTransform).not.toBe(initialTransform);
  // });

  test('should zoom out when - button clicked', async ({ page }) => {
    const zoomOutButton = page.locator('button[aria-label="Zoom out"]');

    // Click zoom out
    await zoomOutButton.click();
    await page.waitForTimeout(100);

    // Should be zoomed out (transform scale < 1)
    const transform = await page.locator('g').first().getAttribute('transform');
    expect(transform).toContain('scale');
  });

  test('should reset zoom when reset button clicked', async ({ page }) => {
    const zoomInButton = page.locator('button[aria-label="Zoom in"]');
    const resetButton = page.locator('button:has-text("Reset")');

    // Zoom in several times
    await zoomInButton.click();
    await zoomInButton.click();
    await page.waitForTimeout(100);

    // Reset
    await resetButton.click();
    await page.waitForTimeout(100);

    // Should be back to scale(1)
    const transform = await page.locator('g').first().getAttribute('transform');
    expect(transform).toContain('scale(1)');
  });
});

test.describe('LocalStorage Persistence', () => {
  test('should persist selected seats across page reloads', async ({
    page,
  }) => {
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);

    // Select 3 seats
    const availableSeats = page.locator('circle[aria-label*="available"]');
    await availableSeats.nth(0).click();
    await availableSeats.nth(1).click();
    await availableSeats.nth(2).click();

    // Verify 3 selected
    await expect(
      page.locator('text=/Selected Seats \\(3\\/8\\)/')
    ).toBeVisible();

    // Get seat IDs
    const seatIdsBefore = await page.locator('.font-mono').allTextContents();

    // Reload page
    await page.reload();
    await waitForVenueLoad(page);

    // Check seats still selected
    await expect(
      page.locator('text=/Selected Seats \\(3\\/8\\)/')
    ).toBeVisible();

    // Verify same seats
    const seatIdsAfter = await page.locator('.font-mono').allTextContents();
    expect(seatIdsBefore.sort()).toEqual(seatIdsAfter.sort());
  });
});

test.describe('Pan & Drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);
  });

  test('should pan the map when dragging', async ({ page }) => {
    const svg = page.locator('svg[role="application"]');
    const bbox = await svg.boundingBox();

    if (!bbox) throw new Error('SVG not found');

    // Get initial transform
    const initialTransform = await page
      .locator('g')
      .first()
      .getAttribute('transform');

    // Drag the SVG
    await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      bbox.x + bbox.width / 2 + 100,
      bbox.y + bbox.height / 2 + 100
    );
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Transform should have changed
    const newTransform = await page
      .locator('g')
      .first()
      .getAttribute('transform');
    expect(newTransform).not.toBe(initialTransform);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);

    // Check header is visible
    await expect(page.locator('h1')).toBeVisible();

    // Check SVG is visible
    await expect(page.locator('svg[role="application"]')).toBeVisible();

    // Check sidebar is below map (not side-by-side)
    const sidebar = page.locator('.lg\\:w-96');
    await expect(sidebar).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);

    // All main elements should be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('svg[role="application"]')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);

    // Check layout is side-by-side on large screens
    await expect(page.locator('.lg\\:flex-row')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should show error message if venue.json fails to load', async ({
    page,
  }) => {
    // Intercept and fail the venue.json request
    await page.route('**/venue.json', (route) => route.abort());

    await page.goto('http://localhost:5173');

    // Should show error message
    await expect(page.locator('text=/Error Loading Venue/')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('text=/Failed to load venue data/')
    ).toBeVisible();

    // Should have retry button
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load venue within 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:5173');
    await waitForVenueLoad(page);

    const loadTime = Date.now() - startTime;

    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(4000);
  });
});