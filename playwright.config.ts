import { defineConfig, devices } from "@playwright/test";

// Local macOS 13 hosts cannot install Playwright's bundled chromium
// (`Playwright does not support chromium on mac13`). Use system Chrome:
//   PLAYWRIGHT_CHANNEL=chrome npx playwright test --project=chromium
// CI (Ubuntu) uses bundled chromium with no env var.
const channel = process.env.PLAYWRIGHT_CHANNEL as "chrome" | undefined;

export default defineConfig({
  testDir: "tests",
  testMatch: ["e2e/**/*.spec.ts", "accessibility/**/*.spec.ts"],
  timeout: 30000,
  fullyParallel: false,
  reporter: [["list"]],
  use: { trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) },
    },
  ],
  webServer: [
    { command: "PORT=4173 node apps/web/build/index.js", port: 4173, reuseExistingServer: true, timeout: 60000 },
    { command: "python3 -m http.server 4174 --directory apps/desktop/build", port: 4174, reuseExistingServer: true, timeout: 60000 },
  ],
});
