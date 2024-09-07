import * as Validation from "../../src/utils/validation";
import { isTagPresetNameValid } from "../../src/utils/validation";

describe("Validation", () => {
  it("isTagPresetNameValid", () => {
    const testCases = [
      {
        name: "valid_name",
        expected: true,
      },
      {
        name: "validname",
        expected: true,
      },
      {
        name: "valid-name",
        expected: true,
      },
      {
        name: "thistagnameistoolong",
        expected: false,
      },
      {
        name: "",
        expected: false,
      },
      {
        name: "invalid name",
        expected: false,
      },
      {
        name: "invalid=name",
        expected: false,
      },
    ];

    testCases.forEach((testCase) => {
      expect(Validation.isTagPresetNameValid(testCase.name)).toBe(
        testCase.expected
      );
    });
  });

  it("inRange", () => {
    const testCases = [
      {
        value: 1,
        min: 1,
        max: 2,
        expected: true,
      },
      {
        value: 1,
        min: 2,
        max: 2,
        expected: false,
      },
      {
        value: 1,
        min: 1,
        max: 1,
        expected: true,
      },
      {
        value: 53,
        min: -100,
        max: 100,
        expected: true,
      },
      {
        value: 153,
        min: -100,
        max: 100,
        expected: false,
      },
    ];

    testCases.forEach((testCase) => {
      expect(
        Validation.inRange(testCase.value, testCase.min, testCase.max)
      ).toBe(testCase.expected);
    });
  });

  it("isUsernameValid", () => {
    const testCases = [
      {
        name: "Bruce",
        expected: true,
      },
      {
        name: "Rizwan_123",
        expected: true,
      },
      {
        name: "Fe-rotiq_123_",
        expected: true,
      },
      {
        name: " ",
        expected: false,
      },
      {
        name: "",
        expected: false,
      },
      {
        name: "superduperlongnamethatshouldbeinvalid",
        expected: false,
      },
      {
        name: ".period",
        expected: false,
      },
    ];

    testCases.forEach((testCase) => {
      expect(Validation.isUsernameValid(testCase.name)).toBe(testCase.expected);
    });
  });

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
      //@ts-ignore
      expect(Validation.isTestTooShort(testCase.result)).toBe(
        testCase.expected
      );
    });
  });
});
