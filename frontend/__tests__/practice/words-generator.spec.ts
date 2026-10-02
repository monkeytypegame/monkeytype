import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageObjectSchema } from "@monkeytype/schemas/languages";
import qwerty from "../../static/layouts/qwerty.json";
import english from "../../static/languages/english.json";
import { Config } from "../../src/ts/config/store";
import { getDefaultConfig } from "../../src/ts/constants/default-config";
import { applyKeySelection } from "../../src/ts/practice/selection";
import { defaultConfig } from "../../src/ts/practice/types";
import { generateWords, getNextWord } from "../../src/ts/test/words-generator";
import * as CustomText from "../../src/ts/test/custom-text";
import {
  setIsRepeated,
  setCurrentQuote,
  setSelectedQuoteId,
} from "../../src/ts/states/test";
import QuotesController from "../../src/ts/controllers/quotes-controller";
import { cachedFetchJson } from "../../src/ts/utils/json-data";

vi.mock("../../src/ts/utils/json-data", async (original) => ({
  ...(await original<typeof import("../../src/ts/utils/json-data")>()),
  getLayout: vi.fn().mockResolvedValue(qwerty),
  cachedFetchJson: vi.fn(),
}));
const language = LanguageObjectSchema.parse(english);
const choose = (
  characters: string,
  style: "balanced" | "words" = "balanced",
): void =>
  applyKeySelection({
    ...defaultConfig,
    characters: Array.from(characters),
    style,
  });
beforeEach(() => {
  Object.assign(Config, getDefaultConfig(), {
    mode: "words",
    words: 10,
    numbers: false,
    punctuation: false,
    funbox: [],
  });
  setIsRepeated(false);
  setCurrentQuote(null);
  applyKeySelection(null);
});
afterEach(() => {
  applyKeySelection(null);
  vi.restoreAllMocks();
});
describe("key selection in the test generator", () => {
  it.each(["time", "words"] as const)(
    "restricts %s drills and extends/repeats their sequence",
    async (mode) => {
      Config.mode = mode;
      Config.numbers = true;
      Config.punctuation = true;
      choose("Aa1!|");
      const generated = await generateWords(language);
      expect(generated.words.length).toBe(mode === "time" ? 100 : 10);
      expect(generated.words.every((word) => /^[Aa1!|]+ $/.test(word))).toBe(
        true,
      );
      const extra = await getNextWord(350, 400, undefined, undefined);
      expect(extra.word).toMatch(/^[Aa1!|]+ $/);
      setIsRepeated(true);
      expect((await generateWords(language)).words).toEqual(generated.words);
      expect(await getNextWord(350, 400, undefined, undefined)).toEqual(extra);
    },
  );
  it("restricts real words and fails explicitly when nothing matches", async () => {
    choose("as", "words");
    expect(
      (await generateWords(language)).words.every((word) =>
        /^[as]+ $/.test(word),
      ),
    ).toBe(true);
    choose("z", "words");
    await expect(generateWords(language)).rejects.toThrow("No words match");
  });
  it("respects toggles and rejects an empty effective selection", async () => {
    choose("a1!");
    expect(
      (await generateWords(language)).words.every((word) => /^a+ $/.test(word)),
    ).toBe(true);
    choose("1!");
    await expect(generateWords(language)).rejects.toThrow(
      "No selected keys are enabled",
    );
  });
  it("filters custom sections without changing the user's source or limit", async () => {
    Config.mode = "custom";
    CustomText.setText(["a A", "bad", "A a"]);
    CustomText.setPipeDelimiter(true);
    CustomText.setMode("repeat");
    CustomText.setLimitMode("section");
    CustomText.setLimitValue(3);
    choose("aA");
    const source = structuredClone(CustomText.getData());
    const generated = await generateWords(language);
    expect(generated.words).toEqual(["a ", "A ", "A ", "a ", "a ", "A "]);
    expect(CustomText.getData()).toEqual(source);
    choose("z");
    await expect(generateWords(language)).rejects.toThrow(
      "No custom text matches",
    );
  });
  it("replaces a repeated sequence when enabled keys change", async () => {
    choose("a1!");
    Config.numbers = true;
    Config.punctuation = true;
    await generateWords(language);
    setIsRepeated(true);
    Config.numbers = false;
    Config.punctuation = false;
    expect(
      (await generateWords(language)).words.every((word) => /^a+ $/.test(word)),
    ).toBe(true);
    choose("z");
    expect(
      (await generateWords(language)).words.every((word) => /^z+ $/.test(word)),
    ).toBe(true);
  });
  it("keeps zen free-form", async () => {
    Config.mode = "zen";
    choose("a");
    expect((await generateWords(language)).words).toEqual([]);
  });
  it("leaves normal tests available after clearing selection", async () => {
    choose("z", "words");
    applyKeySelection(null);
    expect((await generateWords(language)).words).toHaveLength(10);
  });
  it("rejects incompatible funboxes", async () => {
    choose("a");
    Config.funbox = ["no_quit"];
    await expect(generateWords(language)).rejects.toThrow(
      "Clear key selection",
    );
  });
  it("keeps matching quotes complete, rejects mismatches, and can clear the filter", async () => {
    Config.mode = "quote";
    Config.quoteLength = [0];
    vi.mocked(cachedFetchJson).mockResolvedValue({
      language: "english",
      groups: [[0, 100]],
      quotes: [
        { id: 1, text: "A a!", source: "fixture", length: 4 },
        { id: 2, text: "Different.", source: "fixture", length: 10 },
      ],
    });
    choose("Aa!");
    expect((await generateWords(language)).words).toEqual(["A ", "a! "]);
    choose("a");
    await expect(generateWords(language)).rejects.toThrow(
      "No complete quotes match",
    );
    expect(Config.mode).toBe("quote");
    expect(Config.quoteLength).toEqual([0]);
    Config.quoteLength = [-2];
    setSelectedQuoteId(2);
    await expect(generateWords(language)).rejects.toThrow(
      "This quote does not match",
    );
    applyKeySelection(null);
    expect((await generateWords(language)).words).toEqual(["Different. "]);
    expect(QuotesController.getRandomQuote(() => false)).toBeNull();
  });
});
