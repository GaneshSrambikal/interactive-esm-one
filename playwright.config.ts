// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:5173',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Timeout for each action
    actionTimeout: 10 * 1000,
    
  
   
  },
  

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

// ============================================================================
// package.json scripts to add
// ============================================================================
/*
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report",
    "test:e2e:codegen": "playwright codegen http://localhost:5173"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
*/

// ============================================================================
// Installation & Setup Instructions
// ============================================================================

/*
1. INSTALL PLAYWRIGHT
   npm install -D @playwright/test
   npx playwright install

2. CREATE TEST DIRECTORY
   mkdir -p tests/e2e

3. COPY FILES
   - Copy seating-map.spec.ts to tests/e2e/
   - Copy playwright.config.ts to project root

4. RUN TESTS
   npm run test:e2e              # Run all tests
   npm run test:e2e:headed       # See browser
   npm run test:e2e:debug        # Debug mode
   npm run test:e2e:ui           # Interactive UI mode

5. VIEW REPORTS
   npm run test:e2e:report       # Open HTML report
*/

// ============================================================================
// GitHub Actions CI Configuration
// ============================================================================

// .github/workflows/playwright.yml
/*
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: Run Playwright tests
      run: pnpm test:e2e
    
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
*/

// ============================================================================
// Additional Test Examples
// ============================================================================

// tests/e2e/accessibility.spec.ts
/*
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=Metropolis Arena');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

// Install with: npm install -D @axe-core/playwright
*/

// tests/e2e/performance.spec.ts
/*
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should have good web vitals', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      };
    });
    
    // Assert performance thresholds
    expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds
    expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
  });
});
*/

// ============================================================================
// Test Data Helpers
// ============================================================================

// tests/e2e/helpers/test-data.ts
/*
export const TEST_SEATS = {
  available: 'A-1-01',
  reserved: 'A-1-02',
  sold: 'A-1-07',
};

export const PRICE_TIERS = {
  1: 150,
  2: 100,
  3: 50,
};

export async function selectSeats(page: Page, count: number) {
  const seats = page.locator('circle[aria-label*="available"]');
  for (let i = 0; i < count; i++) {
    await seats.nth(i).click();
  }
}

export async function clearAllSeats(page: Page) {
  const clearButton = page.locator('button[aria-label="Clear selection"]');
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }
}
*/

// ============================================================================
// Custom Fixtures
// ============================================================================

// tests/e2e/fixtures/seating-map.fixture.ts
/*
import { test as base } from '@playwright/test';

type SeatingMapFixtures = {
  seatingMap: {
    selectSeat: (seatId: string) => Promise<void>;
    getSelectedCount: () => Promise<number>;
    clearSelection: () => Promise<void>;
  };
};

export const test = base.extend<SeatingMapFixtures>({
  seatingMap: async ({ page }, use) => {
    const seatingMap = {
      selectSeat: async (seatId: string) => {
        await page.locator(`circle[aria-label*="${seatId}"]`).click();
      },
      
      getSelectedCount: async () => {
        const text = await page.locator('text=/Selected Seats \\((\\d+)\\/8\\)/').textContent();
        const match = text?.match(/\\((\\d+)\\/8\\)/);
        return match ? parseInt(match[1], 10) : 0;
      },
      
      clearSelection: async () => {
        const clearButton = page.locator('button[aria-label="Clear selection"]');
        if (await clearButton.isVisible()) {
          await clearButton.click();
        }
      },
    };
    
    await use(seatingMap);
  },
});

// Usage:
// test('should select seats', async ({ page, seatingMap }) => {
//   await page.goto('http://localhost:5173');
//   await seatingMap.selectSeat('A-1-01');
//   const count = await seatingMap.getSelectedCount();
//   expect(count).toBe(1);
// });
*/

// ============================================================================
// Visual Regression Testing Setup
// ============================================================================

/*
For visual regression testing, add to playwright.config.ts:

export default defineConfig({
  // ... other config
  
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  
  // Update screenshots with:
  // playwright test --update-snapshots
});

Visual regression tests will create baseline screenshots on first run,
then compare against baselines on subsequent runs.
*/

// ============================================================================
// Test Coverage Report
// ============================================================================

/*
To generate coverage reports with Playwright:

1. Install c8:
   npm install -D c8

2. Update package.json:
   "test:e2e:coverage": "c8 playwright test"

3. Add to playwright.config.ts:
   use: {
     coverage: {
       enabled: true,
     },
   }

4. Run with coverage:
   npm run test:e2e:coverage

This will generate a coverage report in the coverage/ directory.
*/