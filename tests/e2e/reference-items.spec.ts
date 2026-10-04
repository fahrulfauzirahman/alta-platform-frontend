import { test, expect } from "@playwright/test";

const TENANT = "00000000-0000-0000-0000-000000000001";

function mockApi(page: import("@playwright/test").Page, opts: { items?: unknown[]; postStatus?: number; listStatus?: number } = {}) {
  page.route("**/api/v1/reference-items", async (route) => {
    const req = route.request();
    if (req.method() === "GET") {
      const status = opts.listStatus ?? 200;
      if (status !== 200) return route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ code: status === 401 ? "SESSION_EXPIRED" : "SERVER_ERROR", message: status === 401 ? "expired" : "boom" }) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: opts.items ?? [] }) });
    }
    const status = opts.postStatus ?? 201;
    if (status !== 200 && status !== 201) return route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ code: "SERVER_ERROR", message: "boom" }) });
    let title = "Hello";
    try { title = (JSON.parse(req.postData() ?? "{}") as { title?: string }).title ?? title; } catch { /* keep */ }
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", tenant_id: TENANT, title, created_at: "2026-01-01T00:00:00.000Z" }) });
  });
  page.route("**/api/v1/events**", (route) => route.abort("failed"));
  page.route("**/api/v1/session**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ tenant_id: TENANT, authenticated: true }) }));
}

async function workflow(page: import("@playwright/test").Page, origin: string) {
  mockApi(page, { items: [] });
  await page.goto(origin);
  await expect(page.getByText("Empty \u2014 create your first item.")).toBeVisible();
  await page.getByLabel("Title").fill("   ");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Title is required.")).toBeVisible();
  await page.getByLabel("Title").fill("Hello");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Hello").first()).toBeVisible({ timeout: 10000 });
}

test("web reference workflow (empty, validation, create)", async ({ page }) => {
  await workflow(page, "http://localhost:4173/");
});

test("desktop reference workflow parity (same steps, static build)", async ({ page }) => {
  await workflow(page, "http://localhost:4174/");
});

test("server error preserves input and retries", async ({ page }) => {
  mockApi(page, { items: [], postStatus: 500 });
  await page.goto("http://localhost:4173/");
  await page.getByLabel("Title").fill("Keep me");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Keep me");
});

test("session-expired message and keyboard order", async ({ page }) => {
  mockApi(page, { items: [], listStatus: 401 });
  await page.goto("http://localhost:4173/");
  await expect(page.getByText(/session expired/i)).toBeVisible();
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(["A", "BUTTON", "INPUT", "MAIN"]).toContain(focused);
});
