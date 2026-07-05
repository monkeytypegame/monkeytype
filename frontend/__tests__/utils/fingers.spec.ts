import { describe, expect, it } from "vitest";
import { LayoutObject } from "@monkeytype/schemas/layouts";
import {
  buildDrillWords,
  buildTrainingPool,
  FingerFullNames,
  FingerNames,
  getFingerLetters,
  mixWithNormalWords,
  resolveLayoutName,
  scoreWord,
} from "../../src/ts/utils/fingers";

const qwerty: LayoutObject = {
  keymapShowTopRow: false,
  type: "ansi",
  keys: {
    row1: [
      ["`", "~"],
      ["1", "!"],
      ["2", "@"],
      ["3", "#"],
      ["4", "$"],
      ["5", "%"],
      ["6", "^"],
      ["7", "&"],
      ["8", "*"],
      ["9", "("],
      ["0", ")"],
      ["-", "_"],
      ["=", "+"],
    ],
    row2: [
      ["q", "Q"],
      ["w", "W"],
      ["e", "E"],
      ["r", "R"],
      ["t", "T"],
      ["y", "Y"],
      ["u", "U"],
      ["i", "I"],
      ["o", "O"],
      ["p", "P"],
      ["[", "{"],
      ["]", "}"],
      ["\\", "|"],
    ],
    row3: [
      ["a", "A"],
      ["s", "S"],
      ["d", "D"],
      ["f", "F"],
      ["g", "G"],
      ["h", "H"],
      ["j", "J"],
      ["k", "K"],
      ["l", "L"],
      [";", ":"],
      ["'", '"'],
    ],
    row4: [
      ["z", "Z"],
      ["x", "X"],
      ["c", "C"],
      ["v", "V"],
      ["b", "B"],
      ["n", "N"],
      ["m", "M"],
      [",", "<"],
      [".", ">"],
      ["/", "?"],
    ],
    row5: [[" "]],
  },
};

describe("fingers", () => {
  it("has a full display name for every finger", () => {
    for (const finger of FingerNames) {
      const hand = finger.startsWith("left") ? "left" : "right";
      expect(FingerFullNames[finger].startsWith(hand)).toBe(true);
    }
  });

  describe("resolveLayoutName", () => {
    it("maps the default layout to qwerty", () => {
      expect(resolveLayoutName("default")).toBe("qwerty");
      expect(resolveLayoutName("colemak")).toBe("colemak");
    });
  });

  describe("getFingerLetters", () => {
    it("maps the standard qwerty columns to the right fingers", () => {
      const letters = getFingerLetters(qwerty);

      expect(letters.leftPinky.sort()).toEqual(["a", "q", "z"]);
      expect(letters.leftRing.sort()).toEqual(["s", "w", "x"]);
      expect(letters.leftMiddle.sort()).toEqual(["c", "d", "e"]);
      expect(letters.leftIndex.sort()).toEqual(["b", "f", "g", "r", "t", "v"]);
      expect(letters.rightIndex.sort()).toEqual(["h", "j", "m", "n", "u", "y"]);
      expect(letters.rightMiddle.sort()).toEqual(["i", "k"]);
      expect(letters.rightRing.sort()).toEqual(["l", "o"]);
      expect(letters.rightPinky.sort()).toEqual(["p"]);
    });

    it("ignores digits, symbols and space", () => {
      const letters = getFingerLetters(qwerty);
      const all = Object.values(letters).flat();

      for (const char of all) {
        expect(char.toLowerCase()).not.toBe(char.toUpperCase());
      }
      expect(all).not.toContain(";");
      expect(all).not.toContain(" ");
    });

    it("picks up letters on the number row (e.g. azerty accents)", () => {
      const accented: LayoutObject = {
        ...qwerty,
        keys: {
          ...qwerty.keys,
          row1: [
            ...qwerty.keys.row1.slice(0, 2),
            ["é", "2"],
            ...qwerty.keys.row1.slice(3),
          ],
        },
      };

      const letters = getFingerLetters(accented);
      expect(letters.leftRing).toContain("é");
    });

    it("shifts the bottom row for iso layouts", () => {
      const iso: LayoutObject = {
        keymapShowTopRow: false,
        type: "iso",
        keys: {
          row1: qwerty.keys.row1,
          row2: qwerty.keys.row2.slice(0, 12),
          row3: [...qwerty.keys.row3, ["#", "~"]],
          // iso keyboards have an extra key before z
          row4: [["\\", "|"], ...qwerty.keys.row4],
          row5: [[" "]],
        },
      };

      const letters = getFingerLetters(iso);
      expect(letters.leftPinky.sort()).toEqual(["a", "q", "z"]);
      expect(letters.leftRing.sort()).toEqual(["s", "w", "x"]);
    });

    it("maps matrix layouts positionally", () => {
      const matrix: LayoutObject = {
        keymapShowTopRow: false,
        matrixShowRightColumn: false,
        type: "matrix",
        keys: {
          row1: [],
          row2: qwerty.keys.row2.slice(0, 10),
          row3: qwerty.keys.row3.slice(0, 10),
          row4: [["z"], ["x"], ["c"], ["v"]],
          row5: [],
        },
      };

      const letters = getFingerLetters(matrix);
      expect(letters.leftPinky.sort()).toEqual(["a", "q", "z"]);
      expect(letters.leftRing.sort()).toEqual(["s", "w", "x"]);
      expect(letters.rightPinky.sort()).toEqual(["p"]);
    });
  });

  describe("scoreWord", () => {
    it("returns the fraction of letters typed with target fingers", () => {
      const targets = new Set(["f", "j"]);

      expect(scoreWord("fjfj", targets)).toBe(1);
      expect(scoreWord("fear", targets)).toBe(0.25);
      expect(scoreWord("hello", targets)).toBe(0);
    });

    it("ignores non letter characters", () => {
      const targets = new Set(["t", "d", "o", "n"]);

      // apostrophe is not a letter, so 4/4 letters hit
      expect(scoreWord("don't", targets)).toBe(1);
      expect(scoreWord("123", targets)).toBe(0);
      expect(scoreWord("", targets)).toBe(0);
    });

    it("is case insensitive", () => {
      expect(scoreWord("FJ", new Set(["f", "j"]))).toBe(1);
    });
  });

  describe("buildDrillWords", () => {
    it("combines the letter with the other trained letters", () => {
      expect(buildDrillWords("q", ["a", "z"], 4)).toEqual([
        "qa",
        "qz",
        "aq",
        "zq",
      ]);
    });

    it("repeats the letter when it is trained alone", () => {
      expect(buildDrillWords("p", [], 3)).toEqual(["pp", "ppp", "pppp"]);
    });
  });

  describe("buildTrainingPool", () => {
    it("falls back to letter drills when the language has no words", () => {
      const { pool, drilledLetters } = buildTrainingPool(
        ["hello", "world"],
        new Set(["q", "z"]),
      );

      expect(pool.length).toBeGreaterThan(0);
      expect(pool).toContain("qz");
      expect(pool).toContain("zq");
      expect(drilledLetters.sort()).toEqual(["q", "z"]);
      // every entry still trains the selected letters
      for (const word of new Set(pool)) {
        expect(scoreWord(word, new Set(["q", "z"]))).toBeGreaterThan(0);
      }
    });

    it("tops up letters with too few real words using drills", () => {
      // one real z word, plenty of a words
      const words = [
        ...Array.from({ length: 50 }, (_, i) => `ab${i}`),
        "zebra",
      ];
      const { pool, drilledLetters } = buildTrainingPool(
        words,
        new Set(["a", "z"]),
      );

      expect(pool).toContain("zebra");
      expect(pool).toContain("za");
      expect(drilledLetters).toContain("z");
      expect(drilledLetters).not.toContain("a");
    });

    it("repeats stronger matches more often", () => {
      const targets = new Set(["f", "j"]);
      const { pool } = buildTrainingPool(["fjfj", "fear"], targets);

      const fullMatch = pool.filter((word) => word === "fjfj").length;
      const weakMatch = pool.filter((word) => word === "fear").length;

      // fjfj covers both letter buckets with weight 5 each,
      // fear only appears in the f bucket with weight 2
      expect(fullMatch).toBe(10);
      expect(weakMatch).toBe(2);
      expect(fullMatch).toBeGreaterThan(weakMatch);
    });

    it("caps the number of distinct words at the pool size", () => {
      const words = Array.from({ length: 500 }, (_, i) => `fa${i}`);
      const { pool } = buildTrainingPool(words, new Set(["f"]), 100);

      expect(new Set(pool).size).toBeLessThanOrEqual(100);
    });

    it("does not let common letters crowd out rare ones", () => {
      // lots of words exercising "a", a single word each for "q" and "z"
      const words = [
        ...Array.from({ length: 150 }, (_, i) => `ab${i}`),
        "queen",
        "zone",
      ];

      const { pool } = buildTrainingPool(words, new Set(["q", "a", "z"]), 100);

      expect(pool).toContain("queen");
      expect(pool).toContain("zone");
      // the "a" bucket only gets its per-letter share of the pool
      const distinctAWords = new Set(pool.filter((w) => w.startsWith("ab")));
      expect(distinctAWords.size).toBeLessThanOrEqual(Math.ceil(100 / 3));
    });
  });

  describe("mixWithNormalWords", () => {
    const pool = ["qa", "az", "qaz"];
    const words = ["the", "be", "of"];

    it("returns the pool untouched for frequency 1", () => {
      expect(mixWithNormalWords(pool, words, 1)).toEqual(pool);
    });

    it("adds one normal word per training word for frequency 2", () => {
      const mixed = mixWithNormalWords(pool, words, 2);
      expect(mixed).toHaveLength(6);
      expect(mixed.slice(3)).toEqual(["the", "be", "of"]);
    });

    it("adds two normal words per training word for frequency 3", () => {
      const mixed = mixWithNormalWords(pool, words, 3);
      expect(mixed).toHaveLength(9);
    });
  });
});
