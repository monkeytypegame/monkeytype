import { defineConfig } from "tsup";

export default defineConfig((_options) => ({
  entry: ["src/**/*.ts"],
  splitting: false,
  sourcemap: false,
  clear: !_options.watch,
  format: ["cjs", "esm"],
  dts: false,
}));
