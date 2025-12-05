import { Plugin } from "vite";
import path from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
export function versionFile(options: {
  clientVersion: string;
  skip?: boolean;
}): Plugin {
  return {
    name: "generate-version-json",
    apply: "build",

    closeBundle() {
      if (options?.skip) {
        console.log("Skipping creating version file in dev environment.");
        return;
      }
      const distPath = path.resolve("./dist");
      if (!existsSync(distPath)) {
        mkdirSync(distPath, { recursive: true });
      }

      const versionJson = JSON.stringify({ version: options.clientVersion });
      const versionPath = path.resolve(distPath, "version.json");
      writeFileSync(versionPath, versionJson);
    },
  };
}
