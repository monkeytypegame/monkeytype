import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import Fonts from "../static/fonts/_list.json";
import subsetFont from "subset-font";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generatePreviewFonts(
  debug: boolean = false
): Promise<void> {
  const srcDir = __dirname + "/../static/webfonts";
  const targetDir = __dirname + "/../static/webfonts-preview";
  fs.mkdirSync(targetDir, { recursive: true });

  const srcFiles = fs.readdirSync(srcDir);

  for (const font of Fonts) {
    if (font.systemFont) continue;

    const display = (font.display ?? font.name) + "Fontfamily";

    const fileNames = srcFiles.filter((it) =>
      it.startsWith(font.name.replaceAll(" ", "") + "-")
    );

    if (fileNames.length !== 1)
      throw new Error(
        `cannot find font file for ${font.name}. Candidates: ${fileNames}`
      );
    const fileName = fileNames[0];

    await generateSubset(
      srcDir + "/" + fileName,
      targetDir + "/" + fileName,
      display
    );
    if (debug) {
      console.log(
        `Processing ${font.name} with file ${fileName} to display "${display}".`
      );
    }
  }
}

async function generateSubset(
  source: string,
  target: string,
  name: string
): Promise<void> {
  const font = fs.readFileSync(source);
  const subset = await subsetFont(font, name, {
    targetFormat: "woff2",
  });
  fs.writeFileSync(target, subset);
}
//detect if we run this as a main
if (import.meta.url.endsWith(process.argv[1] as string)) {
  void generatePreviewFonts(true);
}
