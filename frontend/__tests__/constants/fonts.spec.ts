import { Fonts } from "../../src/ts/constants/fonts";
import { readdirSync } from "fs";
const ignoredFonts = new Set([
  "GallaudetRegular", //used for asl
  "Vazirmatn-Regular", //default font
]);
describe("fonts", () => {
  it("should have all related font files", () => {
    const fontFiles = listFontFiles();
    const expectedFontFiles = Object.entries(Fonts)
      .filter(([_name, config]) => !config.systemFont)
      .map(([_name, config]) => config.fileName as string);

    const missingFontFiles = expectedFontFiles
      .filter((fileName) => !fontFiles.includes(fileName))
      .map((name) => `fontend/static/webfonts/${name}.woff2`);

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
      .filter((it) => !expectedFontFiles.has(it))
      .map((it) => `fontend/static/webfonts/${it}.woff2`);

    expect(
      additionalFontFiles,
      "additional font files not declared in frontend/src/ts/constants/fonts.ts"
    ).toEqual([]);
  });
});

function listFontFiles() {
  return readdirSync(import.meta.dirname + "/../../static/webfonts")
    .map((it) => it.substring(0, it.lastIndexOf(".")))
    .filter((it) => !ignoredFonts.has(it));
}
