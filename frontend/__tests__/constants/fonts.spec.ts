import { describe, it, expect } from "vitest";
import { Fonts } from "../../src/ts/constants/fonts";
import { readdirSync } from "fs";
const ignoredFonts = new Set([
  "GallaudetRegular.woff2", //used for asl
  "Vazirmatn-Regular.woff2", //default font
]);
describe("fonts", () => {
  it("should have all related font files", () => {
    const fontFiles = listFontFiles();
    const expectedFontFiles = Object.entries(Fonts)
      .filter(([_name, config]) => !config.systemFont)
      .map(([_name, config]) => config.fileName as string);

    const missingFontFiles = expectedFontFiles
      .filter((fileName) => !fontFiles.includes(fileName))
      .map((name) => `fontend/static/webfonts/${name}`);

    expect(missingFontFiles, "missing font files").toEqual([]);
  });

  it("should not have additional font files", () => {
    const fontFiles = listFontFiles();

    const expectedFontFiles = new Set(
      Object.entries(Fonts)
        .filter(([_name, config]) => !config.systemFont)
        .map(([_name, config]) => config.fileName as string)
    );

    const additionalFontFiles = fontFiles
      .filter((name) => !expectedFontFiles.has(name))
      .map((name) => `fontend/static/webfonts/${name}`);

    expect(
      additionalFontFiles,
      "additional font files not declared in frontend/src/ts/constants/fonts.ts"
    ).toEqual([]);
  });
});

function listFontFiles() {
  return readdirSync(import.meta.dirname + "/../../static/webfonts").filter(
    (it) => !ignoredFonts.has(it)
  );
}
