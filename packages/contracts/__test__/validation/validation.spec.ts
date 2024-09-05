import * as Validation from "../../src/validation/validation";

describe("validation", () => {
  it("containsProfanity", () => {
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
      expect(Validation.containsProfanity(testCase.text, "substring")).toBe(
        testCase.expected
      );
    });
  });
});
