import { Plugin } from "vite";
import { readdirSync, readFileSync } from "fs";
import { TextEncoder } from "util";
import { createHash } from "crypto";

const virtualModuleId = "virtual:language-hashes";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

export function languageHashes(options?: { skip: boolean }): Plugin {
  return {
    name: "virtual-language-hashes",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      return;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (options?.skip) {
          console.log("Skipping language hashing in dev environment.");
        }

        const hashes: Record<string, string> = options?.skip ? {} : getHashes();
        return `
          export const languageHashes = ${JSON.stringify(hashes)};
        `;
      }
      return;
    },
  };
}

function getHashes(): Record<string, string> {
  const start = performance.now();

  console.log("\nHashing languages...");

  const hashes = Object.fromEntries(
    readdirSync("./static/languages").map((file) => {
      return [file.slice(0, -5), calcHash(file)];
    }),
  );

  const end = performance.now();

  console.log(`Creating language hashes took ${Math.round(end - start)} ms`);

  return hashes;
}

function calcHash(file: string): string {
  const currentLanguage = JSON.stringify(
    JSON.parse(readFileSync("./static/languages/" + file).toString()),
    null,
    0,
  );
  const encoder = new TextEncoder();
  const data = encoder.encode(currentLanguage);
  return createHash("sha256").update(data).digest("hex");
}

if (import.meta.url.endsWith(process.argv[1] as string)) {
  console.log(JSON.stringify(getHashes(), null, 4));
}
