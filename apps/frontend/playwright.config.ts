import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3002";
/**
 * See https://playwright.dev/docs/test-configuration.
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
      name: "smoke",
      testMatch: "smoke/**/*.smoke.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run build && npm start",
      url: BASE_URL,
      reuseExistingServer: true,
      env: { BACKEND_URL },
    },
    {
      command:
        "npm run seed:test -w @e-com/backend && npm run build -w @e-com/backend && npm run start:test -w @e-com/backend",
      url: BACKEND_URL,
      reuseExistingServer: true,
    },
  ],
});
