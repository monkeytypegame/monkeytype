import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.VITE_RECAPTCHA_SITE_KEY) {
  throw new Error(".env: RECAPTCHA_SITE_KEY is not defined");
}
export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ["**/*.ts"],
      reporter: ["json"],
    },
  },
});
