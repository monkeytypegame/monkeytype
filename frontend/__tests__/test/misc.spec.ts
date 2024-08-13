import { isObject } from "../../src/ts/utils/misc";
import {
  getLanguageDisplayString,
  removeLanguageSize,
} from "../../src/ts/utils/strings";

//todo this file is in the wrong place

describe("misc.ts", () => {
  describe("getLanguageDisplayString", () => {
    it("should return correctly formatted strings", () => {
      const tests = [
        {
          input: "language",
          noSizeString: false,
          expected: "language",
        },
        {
          input: "language_1k",
          noSizeString: false,
          expected: "language 1k",
        },
        {
          input: "language_1k",
          noSizeString: true,
          expected: "language",
        },
        {
          input: "language_lang",
          noSizeString: false,
          expected: "language lang",
        },
        {
          input: "language_lang_1k",
          noSizeString: false,
          expected: "language lang 1k",
        },
        {
          input: "language_lang_1k",
          noSizeString: true,
          expected: "language lang",
        },
      ];

      tests.forEach((test) => {
        const result = getLanguageDisplayString(test.input, test.noSizeString);
        expect(result).toBe(test.expected);
      });
    });
  });
  describe("removeLanguageSize", () => {
    it("should remove language size", () => {
      const tests = [
        {
          input: "language",
          expected: "language",
        },
        {
          input: "language_1k",
          expected: "language",
        },
        {
          input: "language_lang",
          expected: "language_lang",
        },
        {
          input: "language_lang_1k",
          expected: "language_lang",
        },
      ];

      tests.forEach((test) => {
        const result = removeLanguageSize(test.input);
        expect(result).toBe(test.expected);
      });
    });
  });
  describe("isObject", () => {
    it("should correctly identify objects", () => {
      const tests = [
        {
          input: {},
          expected: true,
        },
        {
          input: { a: 1 },
          expected: true,
        },
        {
          input: [],
          expected: false,
        },
        {
          input: [1, 2, 3],
          expected: false,
        },
        {
          input: "string",
          expected: false,
        },
        {
          input: 1,
          expected: false,
        },
        {
          input: null,
          expected: false,
        },
        {
          input: undefined,
          expected: false,
        },
      ];

      tests.forEach((test) => {
        const result = isObject(test.input);
        expect(result).toBe(test.expected);
      });
    });
  });
});
