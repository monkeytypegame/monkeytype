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

  it("kogascore", () => {
    const testCases = [
      {
        wpm: 214.8,
        acc: 93.04,
        timestamp: 1653586489000,
        expectedScore: 1214800930423111,
      },
      {
        wpm: 214.8,
        acc: 93.04,
        timestamp: 1653601763000,
        expectedScore: 1214800930407837,
      },
      {
        wpm: 199.37,
        acc: 97.69,
        timestamp: 1653588809000,
        expectedScore: 1199370976920791,
      },
      {
        wpm: 196.2,
        acc: 96.07,
        timestamp: 1653591901000,
        expectedScore: 1196200960717699,
      },
    ];

    _.each(testCases, ({ wpm, acc, timestamp, expectedScore }) => {
      expect(misc.kogascore(wpm, acc, timestamp)).toBe(expectedScore);
    });
  });
});
