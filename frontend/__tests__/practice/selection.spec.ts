import { afterEach, describe, expect, it } from "vitest";
import {
  applyKeySelection,
  effectiveCharacters,
  getKeySelection,
  matchesSelection,
} from "../../src/ts/practice/selection";
import { defaultConfig } from "../../src/ts/practice/types";

afterEach(() => applyKeySelection(null));
describe("key selection", () => {
  it("validates, copies and deduplicates selections", () => {
    const config = { ...defaultConfig, characters: ["a", "a", "A", "|"] };
    applyKeySelection(config);
    config.characters.push("x");
    expect(getKeySelection()?.characters).toEqual(["a", "A", "|"]);
    applyKeySelection(null);
    expect(getKeySelection()).toBeNull();
    expect(() =>
      applyKeySelection({ ...defaultConfig, characters: [] }),
    ).toThrow();
  });
  it("matches complete text case-sensitively, allowing whitespace separators", () => {
    expect(matchesSelection("a A\t|\n", ["a", "A", "|"])).toBe(true);
    expect(matchesSelection("a A", ["a"])).toBe(false);
    expect(matchesSelection("a!", ["a"])).toBe(false);
    expect(matchesSelection("  ", ["a"])).toBe(false);
  });
  it("honors toggles without adding unselected characters", () => {
    const chars = ["a", "A", "1", "!", "|"];
    expect(effectiveCharacters(chars, false, false)).toEqual(["a", "A"]);
    expect(effectiveCharacters(chars, true, false)).toEqual(["a", "A", "1"]);
    expect(effectiveCharacters(chars, false, true)).toEqual([
      "a",
      "A",
      "!",
      "|",
    ]);
    expect(effectiveCharacters(chars, true, true)).toEqual(chars);
  });
});
