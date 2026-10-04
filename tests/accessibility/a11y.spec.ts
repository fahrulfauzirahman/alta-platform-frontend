import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("web has no critical axe violations and visible focus", async ({ page }) => {
  await page.route("**/api/v1/reference-items", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) }));
  await page.route("**/api/v1/events**", (r) => r.abort("failed"));
  await page.goto("http://localhost:4173/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical.map((c) => c.id))).toEqual([]);
  await page.getByLabel("Title").focus();
  await expect(page.getByLabel("Title")).toBeFocused();
});

test("desktop static has no critical axe violations", async ({ page }) => {
  await page.route("**/api/v1/reference-items", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) }));
  await page.route("**/api/v1/events**", (r) => r.abort("failed"));
  await page.goto("http://localhost:4174/");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical.map((c) => c.id))).toEqual([]);
});
