import { test, expect } from "@playwright/test";

test("trang đăng nhập hiển thị form", async ({ page }) => {
  await page.goto("/dang-nhap");
  await expect(page.getByRole("heading", { name: /đăng nhập/i })).toBeVisible();
  await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
});

test("API health", async ({ request }) => {
  const apiBase =
    process.env.API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
  const res = await request.get(`${apiBase}/api/v1/health`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBeDefined();
});
