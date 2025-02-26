import { defineConfig } from "tsup";

export default defineConfig((_options) => ({
  entry: ["src/**/*.ts"],
  splitting: false,
  sourcemap: false,
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
}));
