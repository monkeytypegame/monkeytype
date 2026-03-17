import { describe, it, expect, beforeEach } from "vitest";
import { replace } from "../../src/ts/test/british-english";
import Config from "../../src/ts/config";

describe("british-english", () => {
  describe("replace", () => {
    beforeEach(() => (Config.mode = "time"));

    it("should not replace words with no rule", async () => {
      await expect(replace("test", "")).resolves.toEqual("test");
      await expect(replace("Test", "")).resolves.toEqual("Test");
    });

    it("should replace words", async () => {
      await expect(replace("math", "")).resolves.toEqual("maths");
      await expect(replace("Math", "")).resolves.toEqual("Maths");
    });

    it("should replace words with non-word characters around", async () => {
      await expect(replace(" :math-. ", "")).resolves.toEqual(" :maths-. ");
      await expect(replace(" :Math-. ", "")).resolves.toEqual(" :Maths-. ");
    });

    it("should not replace in quote mode if previousWord matches excepted words", async () => {
      //GIVEN
      Config.mode = "quote";

      //WHEN/THEN
      await expect(replace("tire", "will")).resolves.toEqual("tire");
      await expect(replace("tire", "")).resolves.toEqual("tyre");
    });

    it("should replace hyphenated words", async () => {
      await expect(replace("cream-colored", "")).resolves.toEqual(
        "cream-coloured",
      );
      await expect(replace("armor-flavoring", "")).resolves.toEqual(
        "armour-flavouring",
      );
    });

    it("should convert double quotes to single quotes", async () => {
      await expect(replace('"hello"', "")).resolves.toEqual("'hello'");
      await expect(replace('"test"', "")).resolves.toEqual("'test'");
      await expect(replace('"Hello World"', "")).resolves.toEqual(
        "'Hello World'",
      );
    });

    it("should convert double quotes and replace words", async () => {
      await expect(replace('"color"', "")).resolves.toEqual("'colour'");
      await expect(replace('"math"', "")).resolves.toEqual("'maths'");
      await expect(replace('"Color"', "")).resolves.toEqual("'Colour'");
    });

    it("should handle multiple double quotes in a word", async () => {
      await expect(
        replace('He said "hello" and "goodbye"', ""),
      ).resolves.toEqual("He said 'hello' and 'goodbye'");
    });

    it("should not affect words without double quotes", async () => {
      await expect(replace("'hello'", "")).resolves.toEqual("'hello'");
      await expect(replace("test", "")).resolves.toEqual("test");
    });

    it("ignores prototype-related property names (e.g. constructor, __proto__)", async () => {
      await expect(replace("constructor", "")).resolves.toEqual("constructor");
      await expect(replace("__proto__", "")).resolves.toEqual("__proto__");
    });
  });
});
