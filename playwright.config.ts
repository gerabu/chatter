import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${port}`;
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;

if (e2eDatabaseUrl) {
  const databaseName = new URL(e2eDatabaseUrl).pathname.slice(1).toLowerCase();
  if (!databaseName.includes("e2e")) {
    throw new Error("E2E_DATABASE_URL must point to a dedicated database whose name contains 'e2e'.");
  }

  // Keep both the browser app and fixture Prisma client on the explicitly
  // selected E2E database; never fall back to the developer's app database.
  process.env.POSTGRES_PRISMA_URL = e2eDatabaseUrl;
  process.env.POSTGRES_URL_NON_POOLING = e2eDatabaseUrl;
  process.env.NEXTAUTH_URL = baseURL;
  process.env.NEXTAUTH_SECRET = "chatter-local-playwright-session-secret";
  process.env.OPENAI_API_KEY = "playwright-mock-key";
  process.env.OPENAI_BASE_URL = "http://127.0.0.1:4010/v1";
}

const webServer = e2eDatabaseUrl
  ? [
      {
        command: "node tests/e2e/mock-openai.mjs",
        url: "http://127.0.0.1:4010/health",
        reuseExistingServer: false,
        timeout: 10_000,
      },
      {
        command: `pnpm dev --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
    ]
  : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer,
});
