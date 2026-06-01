import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * Mocked e2e tests — no real backend required.
 * Next.js is started with BACKEND_URL pointing at the local mock server (port 3002).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mocked",
      testMatch: "mocked/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run build && npm run start",
      url: BASE_URL,
      reuseExistingServer: true,
      env: { BACKEND_URL: "http://localhost:3002" },
    },
    {
      command: "node e2e/mock-server/server.mjs",
      url: "http://localhost:3002/categories",
      reuseExistingServer: true,
    },
  ],
});
