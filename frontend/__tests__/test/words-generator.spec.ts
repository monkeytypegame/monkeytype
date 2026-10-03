import { describe, it, expect, beforeEach, vi } from "vitest";
import type { LanguageObject } from "@monkeytype/schemas/languages";

vi.mock("../../src/ts/test/wikipedia", () => ({
  getSection: vi.fn(async () => ({
    title: "Mock",
    author: "Mock",
    words: ["fetched", "wikipedia", "words"],
  })),
}));

import { Config } from "../../src/ts/config/store";
import { generateWords } from "../../src/ts/test/words-generator";
import { getSection } from "../../src/ts/test/wikipedia";

const testLanguage: LanguageObject = {
  name: "english",
  words: ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog"],
};

describe("words-generator", () => {
  describe("generateWords", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      Config.mode = "words";
      Config.words = 5;
      Config.funbox = ["wikipedia"];
    });

    it("does not pull the funbox section when skipFunboxSection is true", async () => {
      const result = await generateWords(testLanguage, {
        skipFunboxSection: true,
      });

      expect(getSection).not.toHaveBeenCalled();
      expect(result.words.length).toBeGreaterThan(0);
    });

    it("pulls the funbox section when skipFunboxSection is not set", async () => {
      await generateWords(testLanguage);

      expect(getSection).toHaveBeenCalled();
    });
  });
});
