import { describe, it, expect, vi, type Mock } from "vitest";

vi.mock("../../src/ts/test/funbox/active", () => ({
  isFunboxActiveWithProperty: vi.fn(),
}));

import { isFunboxActiveWithProperty } from "../../src/ts/test/funbox/active";
import * as WordsGenerator from "../../src/ts/test/words-generator";

// tell TypeScript this is a mock
const mockedIsFunboxActiveWithProperty = isFunboxActiveWithProperty as Mock;

describe("words-generator", () => {
  describe("getTextWithCommitChar", () => {
    it("splits the trailing separator into the commit char", () => {
      expect(WordsGenerator.getTextWithCommitChar("the ")).toEqual({
        text: "the",
        commit: " ",
      });
      expect(WordsGenerator.getTextWithCommitChar("cat\n")).toEqual({
        text: "cat",
        commit: "\n",
      });
    });

    it("adds a space if there is no trailing spearator and 'nospace' funbox is off", () => {
      mockedIsFunboxActiveWithProperty.mockReturnValue(false);
      expect(WordsGenerator.getTextWithCommitChar("the ")).toEqual({
        text: "the",
        commit: " ",
      });
      expect(WordsGenerator.getTextWithCommitChar("cat\n")).toEqual({
        text: "cat",
        commit: "\n",
      });
      expect(WordsGenerator.getTextWithCommitChar("sat")).toEqual({
        text: "sat",
        commit: " ",
      });
    });

    it("doesn't add a space if 'nospace' funbox is on", () => {
      mockedIsFunboxActiveWithProperty.mockReturnValue(true);
      expect(WordsGenerator.getTextWithCommitChar("the ")).toEqual({
        text: "the",
        commit: " ",
      });
      expect(WordsGenerator.getTextWithCommitChar("cat\n")).toEqual({
        text: "cat",
        commit: "\n",
      });
      expect(WordsGenerator.getTextWithCommitChar("sat")).toEqual({
        text: "sat",
        commit: "",
      });
    });
  });
});
