import { Plugin } from "vite";
export function versionFile(options: { clientVersion: string }): Plugin {
  return {
    name: "generate-version-json",
    apply: "build",

    generateBundle() {
      this.emitFile({
        type: "asset",
        source: JSON.stringify({ version: options.clientVersion }),
        fileName: "version.json",
      });
    },
  };
}
