import { Plugin } from "vite";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import subsetFont from "subset-font";
import { Fonts } from "../src/ts/constants/fonts";
import { KnownFontName } from "@monkeytype/schemas/fonts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSubset(
  source: string,
  target: string,
  includedCharacters: string,
): Promise<void> {
  const font = fs.readFileSync(source);
  const subset = await subsetFont(font, includedCharacters, {
    targetFormat: "woff2",
  });
  fs.writeFileSync(target, subset);
}

async function generatePreviewFonts(debug: boolean = false): Promise<void> {
  const srcDir = __dirname + "/../static/webfonts";
  const targetDir = __dirname + "/../static/webfonts-preview";
  fs.mkdirSync(targetDir, { recursive: true });

  for (const name of Object.keys(Fonts)) {
    const font = Fonts[name as KnownFontName];
    if (font.systemFont) continue;

    const includedCharacters =
      (font.display ?? name.replaceAll("_", " ")) + "Fontfamily";

    const fileName = font.fileName;

    await generateSubset(
      srcDir + "/" + fileName,
      targetDir + "/" + fileName,
      includedCharacters,
    );
    if (debug) {
      console.log(
        `Processing ${name} with file ${fileName} to display "${includedCharacters}".`,
      );
    }
  }
}

/**
 * Generate a preview file from each font in `static/webfonts` into `static/webfonts-preview`.
 * A preview file only contains the characters needed to show the preview.
 * @returns
 */
export function fontPreview(): Plugin {
  return {
    name: "vite-plugin-webfonts-preview",
    apply: "build",
    async buildStart() {
      const start = performance.now();
      console.log("\nCreating webfonts preview...");

      await generatePreviewFonts();

      const end = performance.now();
      console.log(
        `Creating webfonts preview took ${Math.round(end - start)} ms`,
      );
    },
  };
}

//detect if we run this as a main
if (import.meta.url.endsWith(process.argv[1] as string)) {
  void generatePreviewFonts(true);
}
