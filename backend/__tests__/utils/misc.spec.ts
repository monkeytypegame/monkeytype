import _ from "lodash";
import * as misc from "../../src/utils/misc";
import { ObjectId } from "mongodb";

describe("Misc Utils", () => {
  afterAll(() => {
    vi.useRealTimers();
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

  it("identity", () => {
    const testCases = [
      {
        input: "",
        expected: "string",
      },
      {
        input: {},
        expected: "object",
      },
      {
        input: 0,
        expected: "number",
      },
      {
        input: null,
        expected: "null",
      },
      {
        input: undefined,
        expected: "undefined",
      },
    ];

    _.each(testCases, ({ input, expected }) => {
      expect(misc.identity(input)).toEqual(expected);
    });
  });

  it("flattenObjectDeep", () => {
    const testCases = [
      {
        obj: {
          a: {
            b: {
              c: 1,
            },
          },
          d: 2,
          e: [],
        },
        expected: {
          "a.b.c": 1,
          d: 2,
          e: [],
        },
      },
      {
        obj: {
          a: {
            b: {
              c: 1,
            },
          },
          d: {
            e: {
              f: 2,
              g: 3,
            },
          },
        },
        expected: {
          "a.b.c": 1,
          "d.e.f": 2,
          "d.e.g": 3,
        },
      },
      {
        obj: {
          a: {
            b: {
              c: 1,
              d: {
                e: 2,
                f: 3,
                g: {},
              },
            },
          },
        },
        expected: {
          "a.b.c": 1,
          "a.b.d.e": 2,
          "a.b.d.f": 3,
          "a.b.d.g": {},
        },
      },
      {
        obj: {},
        expected: {},
      },
    ];

    _.each(testCases, ({ obj, expected }) => {
      expect(misc.flattenObjectDeep(obj)).toEqual(expected);
    });
  });

  it("sanitizeString", () => {
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
    ];

    testCases.forEach(({ input, expected }) => {
      expect(misc.sanitizeString(input)).toEqual(expected);
    });
  });

  it("getOrdinalNumberString", () => {
    const testCases = [
      {
        input: 0,
        output: "0th",
      },
      {
        input: 1,
        output: "1st",
      },
      {
        input: 2,
        output: "2nd",
      },
      {
        input: 3,
        output: "3rd",
      },
      {
        input: 4,
        output: "4th",
      },
      {
        input: 10,
        output: "10th",
      },
      {
        input: 11,
        output: "11th",
      },
      {
        input: 12,
        output: "12th",
      },
      {
        input: 13,
        output: "13th",
      },
      {
        input: 100,
        output: "100th",
      },
      {
        input: 101,
        output: "101st",
      },
      {
        input: 102,
        output: "102nd",
      },
      {
        input: 103,
        output: "103rd",
      },
      {
        input: 104,
        output: "104th",
      },
      {
        input: 93589423,
        output: "93589423rd",
      },
    ];

    testCases.forEach(({ input, output }) => {
      expect(misc.getOrdinalNumberString(input)).toEqual(output);
    });
  });
  it("formatSeconds", () => {
    const testCases = [
      {
        seconds: 5,
        expected: "5 seconds",
      },
      {
        seconds: 65,
        expected: "1.08 minutes",
      },
      {
        seconds: misc.HOUR_IN_SECONDS,
        expected: "1 hour",
      },
      {
        seconds: misc.DAY_IN_SECONDS,
        expected: "1 day",
      },
      {
        seconds: misc.WEEK_IN_SECONDS,
        expected: "1 week",
      },
      {
        seconds: misc.YEAR_IN_SECONDS,
        expected: "1 year",
      },
      {
        seconds: 2 * misc.YEAR_IN_SECONDS,
        expected: "2 years",
      },
      {
        seconds: 4 * misc.YEAR_IN_SECONDS,
        expected: "4 years",
      },
      {
        seconds: 3 * misc.WEEK_IN_SECONDS,
        expected: "3 weeks",
      },
      {
        seconds: misc.MONTH_IN_SECONDS * 4,
        expected: "4 months",
      },
      {
        seconds: misc.MONTH_IN_SECONDS * 11,
        expected: "11 months",
      },
    ];

    testCases.forEach(({ seconds, expected }) => {
      expect(misc.formatSeconds(seconds)).toBe(expected);
    });
  });

  describe("replaceObjectId", () => {
    it("replaces objecId with string", () => {
      const fromDatabase = {
        _id: new ObjectId(),
        test: "test",
        number: 1,
      };
      expect(misc.replaceObjectId(fromDatabase)).toStrictEqual({
        _id: fromDatabase._id.toHexString(),
        test: "test",
        number: 1,
      });
    });
    it("ignores null values", () => {
      expect(misc.replaceObjectId(null)).toBeNull();
    });
  });

  describe("replaceObjectIds", () => {
    it("replaces objecIds with string", () => {
      const fromDatabase = {
        _id: new ObjectId(),
        test: "test",
        number: 1,
      };
      const fromDatabase2 = {
        _id: new ObjectId(),
        test: "bob",
        number: 2,
      };
      expect(
        misc.replaceObjectIds([fromDatabase, fromDatabase2])
      ).toStrictEqual([
        {
          _id: fromDatabase._id.toHexString(),
          test: "test",
          number: 1,
        },
        {
          _id: fromDatabase2._id.toHexString(),
          test: "bob",
          number: 2,
        },
      ]);
    });
    it("handles undefined", () => {
      expect(misc.replaceObjectIds(undefined as any)).toBeUndefined();
    });
  });
});
