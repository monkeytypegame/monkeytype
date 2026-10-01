import { describe, expect, it } from "vitest";
import { kebabToCamelCase, sanitizeString } from "../src/strings";

describe("strings", () => {
  describe("kebabToCamelCase", () => {
    it("should convert kebab case to camel case", () => {
      expect(kebabToCamelCase("hello-world")).toEqual("helloWorld");
      expect(kebabToCamelCase("helloWorld")).toEqual("helloWorld");
      expect(
        kebabToCamelCase("one-two-three-four-five-six-seven-eight-nine-ten"),
      ).toEqual("oneTwoThreeFourFiveSixSevenEightNineTen");
    });
  });

  describe("sanitizeString", () => {
    const testCases = [
      {
        input: "h̶̼͔̭͈̏́̀́͋͜ͅe̵̺̞̦̫̫͔̋́̅̅̃̀͝͝ļ̶̬̯͚͇̺͍̞̫̟͖͋̓͛̆̒̓͜ĺ̴̗̘͇̬̆͂͌̈͊͝͝ỡ̴̡̦̩̠̞̐̃͆̚͠͝",
        expected: "hello",
      },
      {
        input: "hello",
        expected: "hello",
      },
      {
        input: "hel   lo",
        expected: "hel  lo",
      },
      {
        input: "   hel   lo   ",
        expected: "hel  lo",
      },
      {
        input: "",
        expected: "",
      },
      {
        input: "   \n\n\n",
        expected: "",
      },
      {
        input: undefined,
        expected: undefined,
      },
      {
        input: "hello\r\n\r\nworld",
        expected: "hello\r\n\r\nworld",
      },
      {
        input: "hello\n\nworld",
        expected: "hello\n\nworld",
      },
      {
        input: "test   \r\n   test",
        expected: "test  \r\n  test",
      },
    ];

    it.each(testCases)(
      "sanitizeString with input '$input' expects '$expected'",
      ({ input, expected }) => {
        expect(sanitizeString(input)).toEqual(expected);
      },
    );
  });
});
