import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // Prevent 'server-only' from throwing in test environment
    "^server-only$": "<rootDir>/__tests__/__mocks__/server-only.ts",
  },
};

export default createJestConfig(config);
