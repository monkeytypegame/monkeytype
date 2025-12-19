import { describe, it, expect } from "vitest";
import { getErrorMessage, isObject, escapeHTML } from "../../src/ts/utils/misc";
import {
  getLanguageDisplayString,
  removeLanguageSize,
} from "../../src/ts/utils/strings";
import { Language } from "@monkeytype/schemas/languages";

describe("misc.ts", () => {
  describe("getLanguageDisplayString", () => {
    it("should return correctly formatted strings", () => {
      const tests: {
        input: Language;
        noSizeString: boolean;
        expected: string;
      }[] = [
        {
          input: "english",
          noSizeString: false,
          expected: "english",
        },
        {
          input: "english_1k",
          noSizeString: false,
          expected: "english 1k",
        },
        {
          input: "english_1k",
          noSizeString: true,
          expected: "english",
        },
        {
          input: "english_medical",
          noSizeString: false,
          expected: "english medical",
        },
        {
          input: "arabic_egypt_1k",
          noSizeString: false,
          expected: "arabic egypt 1k",
        },
        {
          input: "arabic_egypt_1k",
          noSizeString: true,
          expected: "arabic egypt",
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
      const tests: { input: Language; expected: Language }[] = [
        {
          input: "english",
          expected: "english",
        },
        {
          input: "english_1k",
          expected: "english",
        },
        {
          input: "arabic_egypt",
          expected: "arabic_egypt",
        },
        {
          input: "arabic_egypt_1k",
          expected: "arabic_egypt",
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

  describe("escapeHTML", () => {
    it("should escape HTML characters correctly", () => {
      const tests = [
        {
          input: "hello world",
          expected: "hello world",
        },
        {
          input: "<script>alert('xss')</script>",
          expected: "&lt;script&gt;alert(&#39;xss&#39;)&lt;&#x2F;script&gt;",
        },
        {
          input: 'Hello "world" & friends',
          expected: "Hello &quot;world&quot; &amp; friends",
        },
        {
          input: "Click `here` to continue",
          expected: "Click &#x60;here&#x60; to continue",
        },
        {
          input: null,
          expected: null,
        },
        {
          input: undefined,
          expected: undefined,
        },
        {
          input: "",
          expected: "",
        },
      ];

      tests.forEach((test) => {
        const result = escapeHTML(test.input);
        expect(result).toBe(test.expected);
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
});
