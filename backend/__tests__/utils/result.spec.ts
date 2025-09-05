import { describe, it, expect } from "vitest";
import { replaceLegacyValues, DBResult } from "../../src/utils/result";

describe("Result Utils", () => {
  describe("replaceLegacyValues", () => {
    describe("legacy charStats conversion", () => {
      it.each([
        {
          description:
            "should convert correctChars and incorrectChars to charStats",
          correctChars: 95,
          incorrectChars: 5,
          expectedCharStats: [95, 5, 0, 0],
        },
        {
          description: "should handle zero values for legacy chars",
          correctChars: 0,
          incorrectChars: 0,
          expectedCharStats: [0, 0, 0, 0],
        },
        {
          description: "should handle large values for legacy chars",
          correctChars: 9999,
          incorrectChars: 1234,
          expectedCharStats: [9999, 1234, 0, 0],
        },
      ])(
        "$description",
        ({ correctChars, incorrectChars, expectedCharStats }) => {
          const resultWithLegacyChars: DBResult = {
            correctChars,
            incorrectChars,
          } as any;

          const result = replaceLegacyValues(resultWithLegacyChars);

          expect(result.charStats).toEqual(expectedCharStats);
          expect(result.correctChars).toBeUndefined();
          expect(result.incorrectChars).toBeUndefined();
        }
      );

      it("should prioritise charStats when legacy data exists", () => {
        const resultWithBothFormats: DBResult = {
          charStats: [80, 4, 2, 1],
          correctChars: 95,
          incorrectChars: 5,
        } as any;

        const result = replaceLegacyValues(resultWithBothFormats);

        // Should convert legacy values and overwrite existing charStats
        expect(result.charStats).toEqual([80, 4, 2, 1]);
        // Legacy values should be removed after conversion
        expect(result.correctChars).toBeUndefined();
        expect(result.incorrectChars).toBeUndefined();
      });

      it.each([
        {
          description:
            "should not convert when only one legacy property is present",
          input: { correctChars: 95 },
          expectedCharStats: undefined,
          expectedCorrectChars: 95,
          expectedIncorrectChars: undefined,
        },
        {
          description: "should not convert when only incorrectChars is present",
          input: { incorrectChars: 5 },
          expectedCharStats: undefined,
          expectedCorrectChars: undefined,
          expectedIncorrectChars: 5,
        },
      ])(
        "$description",
        ({
          input,
          expectedCharStats,
          expectedCorrectChars,
          expectedIncorrectChars,
        }) => {
          const result = replaceLegacyValues(input as any);

          // Should not convert since both properties are required
          expect(result.charStats).toBe(expectedCharStats);
          expect(result.correctChars).toBe(expectedCorrectChars);
          expect(result.incorrectChars).toBe(expectedIncorrectChars);
        }
      );
    });

    describe("legacy funbox conversion", () => {
      it.each([
        {
          description: "should convert string funbox to array",
          input: "memory#mirror",
          expected: ["memory", "mirror"],
        },
        {
          description: "should convert single funbox string to array",
          input: "memory",
          expected: ["memory"],
        },
        {
          description: "should convert 'none' funbox to empty array",
          input: "none",
          expected: [],
        },
        {
          description: "should handle complex funbox combinations",
          input: "memory#mirror#arrows#58008",
          expected: ["memory", "mirror", "arrows", "58008"],
        },
      ])("$description", ({ input, expected }) => {
        const resultWithStringFunbox: DBResult = {
          funbox: input as any,
        } as any;

        const result = replaceLegacyValues(resultWithStringFunbox);

        expect(result.funbox).toEqual(expected);
      });
    });

    describe("legacy chartData conversion", () => {
      it("should convert chartData with 'raw' property to 'burst'", () => {
        const resultWithLegacyChartData: DBResult = {
          chartData: {
            wpm: [50, 55, 60],
            raw: [52, 57, 62],
            err: [1, 0, 2],
          } as any,
        } as any;

        const result = replaceLegacyValues(resultWithLegacyChartData);

        expect(result.chartData).toEqual({
          wpm: [50, 55, 60],
          burst: [52, 57, 62],
          err: [1, 0, 2],
        });
      });

      it("should not convert chartData when it's 'toolong'", () => {
        const resultWithToolongChartData: DBResult = {
          chartData: "toolong",
        } as any;

        const result = replaceLegacyValues(resultWithToolongChartData);

        expect(result.chartData).toBe("toolong");
      });

      it("should not convert chartData when it doesn't have 'raw' property", () => {
        const resultWithModernChartData: DBResult = {
          chartData: {
            wpm: [50, 55, 60],
            burst: [52, 57, 62],
            err: [1, 0, 2],
          },
        } as any;

        const result = replaceLegacyValues(resultWithModernChartData);

        expect(result.chartData).toEqual({
          wpm: [50, 55, 60],
          burst: [52, 57, 62],
          err: [1, 0, 2],
        });
      });

      it("should not convert chartData when it's undefined", () => {
        const resultWithoutChartData: DBResult = {} as any;

        const result = replaceLegacyValues(resultWithoutChartData);

        expect(result.chartData).toBeUndefined();
      });
    });

    it("should convert all legacy data at once", () => {
      const resultWithAllLegacy: DBResult = {
        correctChars: 100,
        incorrectChars: 8,
        funbox: "memory#mirror" as any,
        chartData: {
          wpm: [50, 55, 60],
          raw: [52, 57, 62],
          err: [1, 0, 2],
        } as any,
      } as any;

      const result = replaceLegacyValues(resultWithAllLegacy);

      expect(result.charStats).toEqual([100, 8, 0, 0]);
      expect(result.correctChars).toBeUndefined();
      expect(result.incorrectChars).toBeUndefined();
      expect(result.funbox).toEqual(["memory", "mirror"]);
      expect(result.chartData).toEqual({
        wpm: [50, 55, 60],
        burst: [52, 57, 62],
        err: [1, 0, 2],
      });
    });

    describe("no legacy values", () => {
      it("should return result unchanged when no legacy values present", () => {
        const modernResult: DBResult = {
          charStats: [95, 5, 2, 1],
          funbox: ["memory"],
        } as any;

        const result = replaceLegacyValues(modernResult);

        expect(result).toEqual(modernResult);
      });
    });
  });
});
