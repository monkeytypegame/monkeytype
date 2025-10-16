import { defineConfig, Options } from "tsup";

export function extendConfig(
  customizer?: (options: Options) => Options
  // tsup uses MaybePromise which is not exported
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (options: Options) => any {
  return (options) => {
    const overrideOptions = customizer?.(options);
    const config: Options = {
      entry: ["src/**/*.ts"],
      splitting: false,
      sourcemap: true,
      clean: !(options.watch === true || options.watch === "true"),
      format: ["cjs", "esm"],
      dts: false,
      minify: true,
      ...overrideOptions,
    };

    return defineConfig(config);
  };
}
