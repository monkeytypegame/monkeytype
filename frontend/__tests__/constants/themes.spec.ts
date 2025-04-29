import { readdirSync } from "fs";
import { ThemesList } from "../../src/ts/constants/themes";

describe("themes", () => {
  it("should not have duplicates", () => {
    const duplicates = ThemesList.filter(
      (item, index) => ThemesList.indexOf(item) !== index
    );
    expect(duplicates).toEqual([]);
  });
  it("should have all related css files", () => {
    const themeFiles = listThemeFiles();

    const missingThemeFiles = ThemesList.filter(
      (it) => !themeFiles.includes(it.name)
    ).map((it) => `fontend/static/themes/${it}.css`);

    expect(missingThemeFiles, "missing theme css files").toEqual([]);
  });
  it("should not have additional css files", () => {
    const themeFiles = listThemeFiles();

    const additionalThemeFiles = themeFiles
      .filter((it) => !ThemesList.some((theme) => theme.name === it))
      .map((it) => `fontend/static/themes/${it}.css`);

    expect(
      additionalThemeFiles,
      "additional theme css files not declared in frontend/src/ts/constants/themes.ts"
    ).toEqual([]);
  });
});

function listThemeFiles() {
  return readdirSync(import.meta.dirname + "/../../static/themes").map((it) =>
    it.substring(0, it.length - 4)
  );
}
