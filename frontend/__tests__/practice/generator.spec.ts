import { describe, it, expect } from "vitest";
import { LayoutObjectSchema } from "@monkeytype/schemas/layouts";
import qwerty from "../../static/layouts/qwerty.json";
import colemak from "../../static/layouts/colemak.json";
import { getKeys } from "../../src/ts/practice/layouts";
import {
  selectPreset,
  charactersForPreset,
  presetGroups,
} from "../../src/ts/practice/presets";
import {
  generateExercise,
  validateTokens,
} from "../../src/ts/practice/generator";
import { defaultConfig as initialConfig } from "../../src/ts/practice/types";
import { DrillSequence, seededRandom } from "../../src/ts/practice/drills";
const defaultConfig = { ...initialConfig, style: "balanced" as const };

const keys = getKeys(LayoutObjectSchema.parse(qwerty), "qwerty");
const sorted = (text: string[]): string => [...text].sort().join("");

describe("physical selections", () => {
  it.each([
    ["lp", "qaz"],
    ["lr", "wsx"],
    ["lm", "edc"],
    ["li", "rtfgvb"],
    ["ri", "yuhjnm"],
    ["rm", "ik"],
    ["rr", "ol"],
    ["rp", "p"],
    ["leftHand", "qwertasdfgzxcvb"],
    ["rightHand", "yuiophjklnm"],
    ["leftHalf", "qwertasdfgzxcvb"],
    ["rightHalf", "yuiophjklnm"],
  ])("maps %s to exactly its letters", (id, expected) => {
    expect(sorted(selectPreset(defaultConfig, id, keys).characters)).toBe(
      sorted(Array.from(expected)),
    );
  });
  it("assigns every physical key once, including digits, with disjoint halves", () => {
    const config = {
      ...defaultConfig,
      category: "all" as const,
      layer: "both" as const,
    };
    const left = selectPreset(config, "leftHand", keys).characters;
    const right = selectPreset(config, "rightHand", keys).characters;
    expect(left.filter((char) => right.includes(char))).toEqual([]);
    expect(new Set([...left, ...right]).size).toBe(94);
  });
  it("intersects regions with categories and composes fingers explicitly", () => {
    const config = { ...defaultConfig, category: "digits" as const };
    expect(selectPreset(config, "leftHand", keys).characters.join("")).toBe(
      "12345",
    );
    const leftIndex = selectPreset(defaultConfig, "li", keys);
    const combined = selectPreset(leftIndex, "ri", keys, true);
    expect(combined.preset).toBe("custom");
    expect(new Set(combined.characters)).toEqual(
      new Set(Array.from("rtfgvbyuhjnm")),
    );
  });
  it("keeps shifted characters separate", () => {
    expect(
      selectPreset(defaultConfig, "digits", keys).characters.join(""),
    ).toBe("1234567890");
    const shifted = selectPreset(defaultConfig, "shifted", keys).characters;
    expect(shifted).toContain("|");
    expect(shifted).not.toContain("1");
    expect(shifted).not.toContain("a");
    expect(
      charactersForPreset(keys, { ...defaultConfig, layer: "shift" }),
    ).toContain("A");
  });
  it("does not invent finger mappings for unsupported layouts", () => {
    const alternate = getKeys(LayoutObjectSchema.parse(colemak), "colemak");
    expect(alternate.every((key) => key.finger === undefined)).toBe(true);
    expect(selectPreset(defaultConfig, "li", alternate).characters).toEqual([]);
  });
});

describe("exercise generation", () => {
  it.each(
    Object.values(presetGroups)
      .flat()
      .map((preset) => [preset.id]),
  )("never escapes %s selection", (id) => {
    const config = selectPreset(defaultConfig, id, keys);
    for (let seed = 1; seed < 12; seed++) {
      for (const style of ["balanced", "patterns"] as const) {
        const exercise = generateExercise(
          { ...config, style },
          [],
          seededRandom(seed),
        );
        expect(exercise.tokens).toHaveLength(50);
        expect(validateTokens(exercise.tokens, config.characters)).toBe(true);
        expect(
          exercise.tokens.every(
            (token) =>
              token.length >= config.minLength &&
              token.length <= config.maxLength,
          ),
        ).toBe(true);
      }
    }
  });
  it("balances quotas and covers a large selection without enumerating combinations", () => {
    const config = selectPreset(
      { ...defaultConfig, amount: 500, minLength: 6, maxLength: 6 },
      "symbols",
      keys,
    );
    const exercise = generateExercise(config, [], seededRandom(12));
    const counts = config.characters.map(
      (char) =>
        Array.from(exercise.tokens.join("")).filter((value) => value === char)
          .length,
    );
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    expect(exercise.missingCharacters).toEqual([]);
  });
  it("supports a single key, and rejects empty or invalid settings", () => {
    expect(
      generateExercise({
        ...defaultConfig,
        characters: ["|"],
        amount: 25,
      }).tokens.every((token) => /^\|+$/.test(token)),
    ).toBe(true);
    expect(() =>
      generateExercise({ ...defaultConfig, characters: [] }),
    ).toThrow("Select");
    expect(() =>
      generateExercise({ ...defaultConfig, minLength: 6, maxLength: 2 }),
    ).toThrow();
    expect(() =>
      generateExercise({ ...defaultConfig, characters: [" "] }),
    ).toThrow();
  });
  it("preserves literal symbols and case with no delimiter conversion", () => {
    const config = { ...defaultConfig, characters: Array.from("|\\'\"[]{}Aa") };
    const exercise = generateExercise(config);
    expect(new Set(exercise.tokens.join(""))).toEqual(
      new Set(config.characters),
    );
  });
  it("reports insufficient coverage honestly", () => {
    const exercise = generateExercise({
      ...defaultConfig,
      amount: 1,
      minLength: 1,
      maxLength: 1,
    });
    expect(exercise.missingCharacters).toHaveLength(
      defaultConfig.characters.length - 1,
    );
  });
  it("real words never silently become character drills", () => {
    const config = {
      ...defaultConfig,
      style: "words" as const,
      characters: ["a", "s"],
      minLength: 1,
    };
    expect(generateExercise(config, ["cat", "DOG"]).tokens).toEqual([]);
    const exercise = generateExercise(config, ["as", "a", "as", "sad"]);
    expect(exercise.matchingWords).toBe(2);
    expect(
      exercise.tokens.every((token) => token === "as" || token === "a"),
    ).toBe(true);
  });
  it("extends timed exercises deterministically and repeats the same text", () => {
    const sequence = new DrillSequence(defaultConfig, [], 5);
    const text = Array.from({ length: 450 }, (_, index) =>
      sequence.tokenAt(index),
    );
    expect(validateTokens(text, defaultConfig.characters)).toBe(true);
    expect(
      Array.from({ length: 450 }, (_, index) => sequence.tokenAt(index)),
    ).toEqual(text);
    const repeated = new DrillSequence(defaultConfig, [], 5);
    expect(
      Array.from({ length: 450 }, (_, index) => repeated.tokenAt(index)),
    ).toEqual(text);
  });
});
