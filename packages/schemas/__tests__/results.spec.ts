import { describe, expect, it } from "vitest";
import {
  CharStatsSchema,
  ChartDataSchema,
  CompletedEventCustomTextSchema,
  CompletedEventSchema,
  CustomTextSettingsSchema,
  IncompleteTestSchema,
  KeyStatsSchema,
  OldChartDataSchema,
  PostResultResponseSchema,
  ResultMinifiedSchema,
  ResultSchema,
  XpBreakdownSchema,
} from "../src/results";

describe("results schemas", () => {
  describe("IncompleteTestSchema", () => {
    it.each([
      {
        description: "valid incomplete test",
        input: {
          acc: 100,
          seconds: 30,
        },
      },
      {
        description: "acc at minimum",
        input: {
          acc: 50,
          seconds: 0,
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(IncompleteTestSchema).toValidate(input);
    });
  });

  describe("OldChartDataSchema", () => {
    it.each([
      {
        description: "valid chart data",
        input: {
          wpm: [100, 110, 120],
          raw: [105, 115, 125],
          err: [0, 1, 2],
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(OldChartDataSchema).toValidate(input);
    });
  });

  describe("ChartDataSchema", () => {
    it.each([
      {
        description: "valid chart data",
        input: {
          wpm: [100, 110, 120],
          burst: [95, 105, 115],
          err: [0, 1, 2],
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(ChartDataSchema).toValidate(input);
    });
  });

  describe("KeyStatsSchema", () => {
    it.each([
      {
        description: "valid key stats",
        input: {
          average: 50,
          sd: 10,
        },
      },
      {
        description: "zero values",
        input: {
          average: 0,
          sd: 0,
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(KeyStatsSchema).toValidate(input);
    });
  });

  describe("CompletedEventCustomTextSchema", () => {
    it.each([
      {
        description: "valid custom text settings",
        input: {
          textLen: 100,
          mode: "repeat",
          pipeDelimiter: false,
          limit: {
            mode: "word",
            value: 100,
          },
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(CompletedEventCustomTextSchema).toValidate(input);
    });
  });

  describe("CustomTextSettingsSchema", () => {
    it.each([
      {
        description: "valid custom text settings",
        input: {
          text: ["hello", "world"],
          mode: "repeat",
          pipeDelimiter: false,
          limit: {
            mode: "word",
            value: 100,
          },
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(CustomTextSettingsSchema).toValidate(input);
    });
  });

  describe("CharStatsSchema", () => {
    it.each([
      {
        description: "valid char stats",
        input: [100, 5, 2, 3],
      },
    ] as const)("$description", ({ input }) => {
      expect(CharStatsSchema).toValidate(input);
    });
  });

  describe("ResultSchema", () => {
    it.each([
      {
        description: "valid result",
        input: {
          wpm: 100,
          rawWpm: 110,
          charStats: [100, 5, 2, 3],
          acc: 98,
          mode: "time",
          mode2: "15",
          timestamp: 1000000000,
          testDuration: 30,
          consistency: 95,
          keyConsistency: 90,
          chartData: { wpm: [100], burst: [95], err: [0] },
          uid: "abc123",
          _id: "def456",
          name: "Test Result",
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(ResultSchema).toValidate(input);
    });
  });

  describe("ResultMinifiedSchema", () => {
    it.each([
      {
        description: "valid minified result",
        input: {
          wpm: 100,
          rawWpm: 110,
          charStats: [100, 5, 2, 3],
          acc: 98,
          mode: "time",
          mode2: "15",
          timestamp: 1000000000,
          testDuration: 30,
          consistency: 95,
          keyConsistency: 90,
          uid: "abc123",
          _id: "def456",
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(ResultMinifiedSchema).toValidate(input);
    });
  });

  describe("CompletedEventSchema", () => {
    it.each([
      {
        description: "valid completed event",
        input: {
          wpm: 100,
          rawWpm: 110,
          charStats: [100, 5, 2, 3],
          acc: 98,
          mode: "time",
          mode2: "15",
          timestamp: 1000000000,
          testDuration: 30,
          restartCount: 1,
          incompleteTestSeconds: 5,
          afkDuration: 0,
          tags: ["abc123"],
          bailedOut: false,
          blindMode: false,
          lazyMode: false,
          funbox: ["ascii"],
          language: "english",
          difficulty: "normal",
          numbers: false,
          punctuation: false,
          consistency: 95,
          keyConsistency: 90,
          uid: "uid123",
          chartData: { wpm: [100], burst: [95], err: [0] },
          charTotal: 150,
          challenge: "abc_123",
          hash: "abc123",
          keyDuration: [100, 120, 90],
          keySpacing: [50, 60, 45],
          keyOverlap: 10,
          lastKeyToEnd: 200,
          startToFirstKey: 500,
          wpmConsistency: 95,
          stopOnLetter: false,
          incompleteTests: [{ acc: 100, seconds: 30 }],
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(CompletedEventSchema).toValidate(input);
    });
  });

  describe("XpBreakdownSchema", () => {
    it.each([
      {
        description: "valid xp breakdown",
        input: {
          base: 10,
          fullAccuracy: 5,
          quote: 2,
          corrected: 3,
          punctuation: 1,
          numbers: 0,
          funbox: 0,
          streak: 0,
          incomplete: 0,
          daily: 0,
          accPenalty: 0,
          configMultiplier: 1,
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(XpBreakdownSchema).toValidate(input);
    });
  });

  describe("PostResultResponseSchema", () => {
    it.each([
      {
        description: "valid post result response",
        input: {
          insertedId: "abc123",
          isPb: true,
          tagPbs: [],
          xp: 15,
          dailyXpBonus: false,
          xpBreakdown: {
            base: 10,
            fullAccuracy: 5,
            quote: 2,
            corrected: 3,
            punctuation: 1,
            numbers: 0,
            funbox: 0,
            streak: 0,
            incomplete: 0,
            daily: 0,
            accPenalty: 0,
            configMultiplier: 1,
          },
          streak: 5,
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(PostResultResponseSchema).toValidate(input);
    });
  });
});
