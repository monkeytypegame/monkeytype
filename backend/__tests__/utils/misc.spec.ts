import _ from "lodash";
import * as misc from "../../src/utils/misc";

describe("Misc Utils", () => {
  it("getCurrentDayTimestamp", () => {
    Date.now = jest.fn(() => 1652743381);

    const currentDay = misc.getCurrentDayTimestamp();
    expect(currentDay).toBe(1641600000);
  });

  it("matchesAPattern", () => {
    const testCases = {
      "eng.*": {
        cases: ["english", "aenglish", "en", "eng"],
        expected: [true, false, false, true],
      },

      "\\d+": {
        cases: ["b", "2", "331", "1a"],
        expected: [false, true, true, false],
      },
      "(hi|hello)": {
        cases: ["hello", "hi", "hillo", "hi hello"],
        expected: [true, true, false, false],
      },
      ".+": {
        cases: ["a2", "b2", "c1", ""],
        expected: [true, true, true, false],
      },
    };

    _.each(testCases, (testCase, pattern) => {
      const { cases, expected } = testCase;
      _.each(cases, (caseValue, index) => {
        expect(misc.matchesAPattern(caseValue, pattern)).toBe(expected[index]);
      });
    });
  });

  it("tensComplement", () => {
    const testCases = [
      {
        input: 123,
        expected: 877,
      },
      {
        input: 877,
        expected: 123,
      },
      {
        input: 0,
        expected: 0,
      },
      {
        input: 86423,
        expected: 13577,
      },
      {
        input: 10998739999,
        expected: 89001260001,
      },
    ];

    _.each(testCases, ({ input, expected }) => {
      expect(misc.tensComplement(input)).toBe(expected);
    });
  });

  it("kogascore", () => {
    const testCases = [
      {
        wpm: 214.8,
        acc: 93.04,
        timestamp: 1653586489000,
        expectedScore: 1214800930436711,
      },
      {
        wpm: 214.8,
        acc: 93.04,
        timestamp: 1653601763000,
        expectedScore: 1214800930421437,
      },
      {
        wpm: 199.37,
        acc: 97.69,
        timestamp: 1653588809000,
        expectedScore: 1199370976934391,
      },
      {
        wpm: 196.2,
        acc: 96.07,
        timestamp: 1653591901000,
        expectedScore: 1196200960731299,
      },
    ];

    _.each(testCases, ({ wpm, acc, timestamp, expectedScore }) => {
      expect(misc.kogascore(wpm, acc, timestamp)).toBe(expectedScore);
    });
  });
});
