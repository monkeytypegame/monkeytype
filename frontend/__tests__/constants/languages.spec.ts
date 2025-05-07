import { readdirSync } from "fs";
import { LanguageGroups, LanguageList } from "../../src/ts/constants/languages";
import { Language } from "@monkeytype/contracts/schemas/languages";

describe("languages", () => {
  describe("LanguageList", () => {
    it("should not have duplicates", () => {
      const duplicates = LanguageList.filter(
        (item, index) => LanguageList.indexOf(item) !== index
      );
      expect(duplicates).toEqual([]);
    });
    it("should have all related json files", () => {
      const languageFiles = listLanguageFiles();

      const missingLanguageFiles = LanguageList.filter(
        (it) => !languageFiles.includes(it)
      ).map((it) => `fontend/static/languages/${it}.json`);

      expect(missingLanguageFiles, "missing language json files").toEqual([]);
    });
    it("should not have additional related json files", () => {
      const LanguageFiles = listLanguageFiles();

      const additionalLanguageFiles = LanguageFiles.filter(
        (it) => !LanguageList.some((language) => language === it)
      ).map((it) => `fontend/static/languages/${it}.json`);

      expect(
        additionalLanguageFiles,
        "additional language json files not declared in frontend/src/ts/constants/languages.ts"
      ).toEqual([]);
    });
  });
  describe("LanguageGroups", () => {
    it("should contain each language once", () => {
      const languagesWithMultipleGroups = [];

      const groupByLanguage = new Map<Language, string>();

      for (const group of Object.keys(LanguageGroups)) {
        for (const language of LanguageGroups[group] as Language[]) {
          if (groupByLanguage.has(language)) {
            languagesWithMultipleGroups.push(language);
          }
          groupByLanguage.set(language, group);
        }
      }

      expect(
        languagesWithMultipleGroups,
        "languages with multiple groups"
      ).toEqual([]);

      expect(
        Array.from(groupByLanguage.keys()).sort(),
        "every language has a group"
      ).toEqual(LanguageList.sort());
    });
  });
});

function listLanguageFiles() {
  return readdirSync(import.meta.dirname + "/../../static/languages").map(
    (it) => it.substring(0, it.length - 5) as Language
  );
}
