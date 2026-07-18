import { describe, it, expect, beforeEach } from "vitest";
import { replace } from "../../src/ts/test/british-english";
import { Config } from "../../src/ts/config/store";

describe("british-english", () => {
  describe("replace", () => {
    beforeEach(() => (Config.mode = "time"));

    it("should not replace words with no rule", () => {
      expect(replace("test", "")).toEqual("test");
      expect(replace("Test", "")).toEqual("Test");
    });

    it("should replace words", () => {
      expect(replace("math", "")).toEqual("maths");
      expect(replace("Math", "")).toEqual("Maths");
    });

    it("should replace words with non-word characters around", () => {
      expect(replace(" :math-. ", "")).toEqual(" :maths-. ");
      expect(replace(" :Math-. ", "")).toEqual(" :Maths-. ");
    });

    it("should not replace in quote mode if previousWord matches excepted words", () => {
      //GIVEN
      Config.mode = "quote";

      //WHEN/THEN
      expect(replace("tire", "will")).toEqual("tire");
      expect(replace("tire", "")).toEqual("tyre");
    });

    it("should replace hyphenated words", () => {
      expect(replace("cream-colored", "")).toEqual("cream-coloured");
      expect(replace("armor-flavoring", "")).toEqual("armour-flavouring");
    });

    it("should convert double quotes to single quotes", () => {
      expect(replace('"hello"', "")).toEqual("'hello'");
      expect(replace('"test"', "")).toEqual("'test'");
      expect(replace('"Hello World"', "")).toEqual("'Hello World'");
    });

    it("should convert double quotes and replace words", () => {
      expect(replace('"color"', "")).toEqual("'colour'");
      expect(replace('"math"', "")).toEqual("'maths'");
      expect(replace('"Color"', "")).toEqual("'Colour'");
    });

    it("should handle multiple double quotes in a word", () => {
      expect(replace('He said "hello" and "goodbye"', "")).toEqual(
        "He said 'hello' and 'goodbye'",
      );
    });

    it("should not affect words without double quotes", () => {
      expect(replace("'hello'", "")).toEqual("'hello'");
      expect(replace("test", "")).toEqual("test");
    });

    it("ignores prototype-related property names (e.g. constructor, __proto__)", () => {
      expect(replace("constructor", "")).toEqual("constructor");
      expect(replace("__proto__", "")).toEqual("__proto__");
    });
  });
});
