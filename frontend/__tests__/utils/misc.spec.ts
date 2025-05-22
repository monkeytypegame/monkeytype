import { z } from "zod";
import {
  deepClone,
  getErrorMessage,
  isObject,
  sanitize,
} from "../../src/ts/utils/misc";
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
  describe("deepClone", () => {
    it("should correctly clone objects", () => {
      const tests = [
        {
          input: {},
          expected: {},
        },
        {
          input: { a: 1 },
          expected: { a: 1 },
        },
        {
          input: { a: { b: 2 } },
          expected: { a: { b: 2 } },
        },
        {
          input: { a: { b: 2 }, c: [1, 2, 3] },
          expected: { a: { b: 2 }, c: [1, 2, 3] },
        },
        {
          input: [],
          expected: [],
        },
        {
          input: [1, 2, 3],
          expected: [1, 2, 3],
        },
        {
          input: "string",
          expected: "string",
        },
        {
          input: 1,
          expected: 1,
        },
        {
          input: null,
          expected: null,
        },
        {
          input: undefined,
          expected: undefined,
        },
      ];

      tests.forEach((test) => {
        const result = deepClone(test.input);
        expect(result).toStrictEqual(test.expected);
      });
    });
  });
  describe("getErrorMesssage", () => {
    it("should correctly get the error message", () => {
      const tests = [
        {
          input: null,
          expected: undefined,
        },
        {
          input: undefined,
          expected: undefined,
        },
        {
          input: "",
          expected: undefined,
        },
        {
          input: {},
          expected: undefined,
        },
        {
          input: "error message",
          expected: "error message",
        },
        {
          input: 1,
          expected: "1",
        },
        {
          input: { message: "error message" },
          expected: "error message",
        },
        {
          input: { message: 1 },
          expected: "1",
        },
        {
          input: { message: "" },
          expected: undefined,
        },
        {
          input: { message: {} },
          expected: undefined,
        },
        {
          input: new Error("error message"),
          expected: "error message",
        },
      ];

      tests.forEach((test) => {
        const result = getErrorMessage(test.input);
        expect(result).toBe(test.expected);
      });
    });
  });
  describe("sanitize function", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      tags: z.array(z.string()),
    });

    it("should return the same object if it is valid", () => {
      const obj = { name: "Alice", age: 30, tags: ["developer", "coder"] };
      expect(sanitize(schema, obj)).toEqual(obj);
    });

    it("should remove properties with invalid values", () => {
      const obj = { name: "Alice", age: -5, tags: ["developer", "coder"] };
      expect(sanitize(schema, obj)).toEqual({
        name: "Alice",
        tags: ["developer", "coder"],
        age: undefined,
      });
    });

    it("should remove invalid array elements", () => {
      const obj = {
        name: "Alice",
        age: 30,
        tags: ["developer", 123, "coder"] as any,
      };
      expect(sanitize(schema, obj)).toEqual({
        name: "Alice",
        age: 30,
        tags: ["developer", "coder"],
      });
    });

    it("should remove entire property if all array elements are invalid", () => {
      const obj = { name: "Alice", age: 30, tags: [123, 456] as any };
      expect(sanitize(schema, obj)).toEqual({
        name: "Alice",
        age: 30,
        tags: undefined,
      });
    });

    it("should remove object properties if they are invalid", () => {
      const obj = { name: 123 as any, age: 30, tags: ["developer", "coder"] };
      expect(sanitize(schema, obj)).toEqual({
        age: 30,
        tags: ["developer", "coder"],
        name: undefined,
      });
    });
  });
});
