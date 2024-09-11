import * as Validation from "../../src/utils/validation";

describe("Validation", () => {
  it("isTestTooShort", () => {
    const testCases = [
      {
        result: {
          mode: "time",
          mode2: 10,
          customText: undefined,
          testDuration: 10,
          bailedOut: false,
        },
        expected: true,
      },
      {
        result: {
          mode: "time",
          mode2: 15,
          customText: undefined,
          testDuration: 15,
          bailedOut: false,
        },
        expected: false,
      },
      {
        result: {
          mode: "time",
          mode2: 0,
          customText: undefined,
          testDuration: 20,
          bailedOut: false,
        },
        expected: false,
      },
      {
        result: {
          mode: "time",
          mode2: 0,
          customText: undefined,
          testDuration: 2,
          bailedOut: false,
        },
        expected: true,
      },
    ];

    testCases.forEach((testCase) => {
      expect(Validation.isTestTooShort(testCase.result as any)).toBe(
        testCase.expected
      );
    });
  });
});
