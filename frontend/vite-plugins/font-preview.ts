import { Plugin } from "vite";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import subsetFont from "subset-font";
import { Fonts } from "../src/ts/constants/fonts";
import { KnownFontName } from "@monkeytype/schemas/fonts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a preview file from each font in `static/webfonts` into `dist/webfonts-preview`.
 * A preview file only contains the characters needed to show the preview.
 * @returns
 */
export function fontPreview(): Plugin {
  return {
    name: "vite-plugin-webfonts-preview",
    apply: "build",

    async generateBundle() {
      const srcDir = __dirname + "/../static/webfonts";
      const start = performance.now();
      console.log("\nCreating webfonts preview...");

      for (const name of Object.keys(Fonts)) {
        const font = Fonts[name as KnownFontName];
        if (font.systemFont) continue;

        const includedCharacters =
          (font.display ?? name.replaceAll("_", " ")) + "Fontfamily";

        const fileName = font.fileName;

        const fontFile = fs.readFileSync(srcDir + "/" + fileName);
        const subset = await subsetFont(fontFile, includedCharacters, {
          targetFormat: "woff2",
        });

        this.emitFile({
          type: "asset",
          fileName: `webfonts-preview/${fileName}`,
          source: subset,
        });
      }

      const end = performance.now();
      console.log(
        `Creating webfonts preview took ${Math.round(end - start)} ms`,
      );
    },
  };
}
