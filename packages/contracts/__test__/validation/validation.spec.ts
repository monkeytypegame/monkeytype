import { describe, it, expect } from "vitest";
import * as Validation from "@monkeytype/schemas/validation/validation";

const containsDisallowedWords = Validation.__testing.containsDisallowedWords;

describe("validation", () => {
  it("containsDisallowedWords", () => {
    const testCases = [
      {
        text: "https://www.fuckyou.com",
        expected: true,
      },
      {
        text: "fucking_profane",
        expected: true,
      },
      {
        text: "fucker",
        expected: true,
      },
      {
        text: "Hello world!",
        expected: false,
      },
      {
        text: "I fucking hate you",
        expected: true,
      },
      {
        text: "I love you",
        expected: false,
      },
      {
        text: "\n.fuck!",
        expected: true,
      },
    ];

    testCases.forEach((testCase) => {
      expect(containsDisallowedWords(testCase.text, "substring")).toBe(
        testCase.expected,
      );
    });
  });
});
