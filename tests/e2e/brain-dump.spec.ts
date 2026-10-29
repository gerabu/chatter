import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";

const e2eDatabaseConfigured = Boolean(process.env.E2E_DATABASE_URL);
const sessionSecret = "chatter-local-playwright-session-secret";
const pool = process.env.E2E_DATABASE_URL
  ? new Pool({ connectionString: process.env.E2E_DATABASE_URL })
  : null;

test.skip(!e2eDatabaseConfigured, "Set E2E_DATABASE_URL to a dedicated local database ending in '_e2e'.");

test("user reviews suggestion, approves it, and sees persisted task", async ({ page }) => {
  // Arrange: create isolated user and session in the dedicated E2E database.
  if (!pool) throw new Error("E2E_DATABASE_URL is required for browser tests.");
  const userId = randomUUID();
  const userEmail = `playwright-${randomUUID()}@example.test`;
  await pool.query(
    'INSERT INTO "User" ("id", "username", "email", "updatedAt") VALUES ($1, $2, $3, NOW())',
    [userId, "Playwright Test", userEmail],
  );
  const token = await encode({ token: { userId }, secret: sessionSecret });

  try {
    await page.context().addCookies([{
      name: "next-auth.session-token",
      value: token,
      url: process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3100",
      httpOnly: true,
      sameSite: "Lax",
    }]);

    // Act: request a suggestion, review it, then explicitly approve it.
    await page.goto("/app/tasks");
    await page.getByRole("textbox").fill("Plan dentist appointment");
    await page.getByRole("button", { name: "Generate suggestions" }).click();
    await expect(page.getByText("E2E dentist appointment")).toBeVisible();
    await page.getByRole("button", { name: "Accept changes" }).click();

    // Assert: application succeeds and persisted task appears after refresh.
    await expect(page.getByText("Changes applied")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Status for E2E dentist appointment" })).toHaveValue("TODO");
    await expect.poll(async () => {
      const result = await pool.query(
        'SELECT "id" FROM "Task" WHERE "user_id" = $1 AND "title" = $2 AND "deleted_at" IS NULL',
        [userId, "E2E dentist appointment"],
      );
      return result.rowCount;
    }).toBe(1);
  } finally {
    // Cascade deletes only this test's records; shared DB data stays untouched.
    await pool.query('DELETE FROM "User" WHERE "id" = $1', [userId]);
  }
});

test.afterAll(async () => {
  await pool?.end();
});
