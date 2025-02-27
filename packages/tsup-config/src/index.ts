import { defineConfig, Options } from "tsup";

export function extendConfig(
  _options: Options,
  overrideOptions?: Options
  // tsup uses MaybePromise which is not exported
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const config: Options = {
    entry: ["src/**/*.ts"],
    splitting: false,
    sourcemap: true,
    clean: !(_options.watch === true || _options.watch === "true"),
    format: ["cjs", "esm"],
    dts: false,
    ...(overrideOptions || {}),
  };
  return defineConfig(config);
}
