import { defineConfig } from "tsup";

export default defineConfig((_options) => ({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: false,
  clear: _options?.watch !== true,
  format: ["cjs", "esm"],
  dts: false,
}));
