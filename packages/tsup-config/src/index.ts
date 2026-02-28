import { defineConfig, Options } from "tsup";

export function extendConfig(
  customizer?: (options: Options) => Options,
): (options: Options) => unknown {
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
