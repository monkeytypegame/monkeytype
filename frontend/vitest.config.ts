import { defineConfig } from "vitest/config";
import { languageHashes } from "./scripts/language-hashes";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globalSetup: "__tests__/global-setup.ts",
    setupFiles: ["__tests__/setup-tests.ts"],

    coverage: {
      include: ["**/*.ts"],
    },
    deps: {
      optimizer: {
        web: {
          include: ["@monkeytype/funbox"],
        },
      },
    },
  },

  plugins: [languageHashes()],
});
