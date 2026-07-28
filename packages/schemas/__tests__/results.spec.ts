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
      {
        description: "invalid - acc exceeds 100",
        input: { acc: 101, seconds: 30 },
        expectedError: "Number must be less than or equal to 100",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(IncompleteTestSchema).toReject(input, expectedError);
      } else {
        expect(IncompleteTestSchema).toValidate(input);
      }
    });
  });

  describe("OldChartDataSchema", () => {
    const validChart = {
      wpm: [100, 110, 120],
      raw: [105, 115, 125],
      err: [0, 1, 2],
    };
    it.each([
      {
        description: "valid chart data",
        input: validChart,
      },
      {
        description: "invalid - negative value in wpm array",
        input: { ...validChart, wpm: [-1, 110, 120] },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(OldChartDataSchema).toReject(input, expectedError);
      } else {
        expect(OldChartDataSchema).toValidate(input);
      }
    });
  });

  describe("ChartDataSchema", () => {
    const validChart = {
      wpm: [100, 110, 120],
      burst: [95, 105, 115],
      err: [0, 1, 2],
    };
    it.each([
      {
        description: "valid chart data",
        input: validChart,
      },
      {
        description: "invalid - negative value in burst array",
        input: { ...validChart, burst: [95, -105, 115] },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ChartDataSchema).toReject(input, expectedError);
      } else {
        expect(ChartDataSchema).toValidate(input);
      }
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
      {
        description: "invalid - negative average",
        input: { average: -50, sd: 10 },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(KeyStatsSchema).toReject(input, expectedError);
      } else {
        expect(KeyStatsSchema).toValidate(input);
      }
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
      {
        description: "invalid - negative textLen",
        input: {
          ...({} as any),
          textLen: -100,
          mode: "repeat",
          pipeDelimiter: false,
          limit: { mode: "word", value: 100 },
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CompletedEventCustomTextSchema).toReject(input, expectedError);
      } else {
        expect(CompletedEventCustomTextSchema).toValidate(input);
      }
    });
  });

  describe("CustomTextSettingsSchema", () => {
    const validSettings = {
      text: ["hello", "world"],
      mode: "repeat",
      pipeDelimiter: false,
      limit: {
        mode: "word",
        value: 100,
      },
    };
    it.each([
      {
        description: "valid custom text settings",
        input: validSettings,
      },
      {
        description: "invalid - empty text array",
        input: { ...validSettings, text: [] },
        expectedError: "Array must contain at least 1 element(s)",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CustomTextSettingsSchema).toReject(input, expectedError);
      } else {
        expect(CustomTextSettingsSchema).toValidate(input);
      }
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
    const validResult = {
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
    };
    it.each([
      {
        description: "valid result",
        input: validResult,
      },
      {
        description: "invalid - wpm exceeds max",
        input: { ...validResult, wpm: 501 },
        expectedError: "Number must be less than or equal to 420",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ResultSchema).toReject(input, expectedError);
      } else {
        expect(ResultSchema).toValidate(input);
      }
    });
  });

  describe("ResultMinifiedSchema", () => {
    const validResult = {
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
    };
    it.each([
      {
        description: "valid minified result",
        input: validResult,
      },
      {
        description: "invalid - acc below minimum 50",
        input: { ...validResult, acc: 49 },
        expectedError: "Number must be greater than or equal to 50",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ResultMinifiedSchema).toReject(input, expectedError);
      } else {
        expect(ResultMinifiedSchema).toValidate(input);
      }
    });
  });

  describe("CompletedEventSchema", () => {
    const validEvent = {
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
      hash: "abc123",
      keyDuration: [100, 120, 90],
      keySpacing: [50, 60, 45],
      keyOverlap: 10,
      lastKeyToEnd: 200,
      startToFirstKey: 500,
      wpmConsistency: 95,
      stopOnLetter: false,
      incompleteTests: [{ acc: 100, seconds: 30 }],
    };
    it.each([
      {
        description: "valid completed event",
        input: validEvent,
      },
      {
        description: "invalid - wpm exceeds max",
        input: { ...validEvent, wpm: 501 },
        expectedError: "Number must be less than or equal to 420",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CompletedEventSchema).toReject(input, expectedError);
      } else {
        expect(CompletedEventSchema).toValidate(input);
      }
    });
  });

  describe("XpBreakdownSchema", () => {
    const validBreakdown = {
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
    };
    it.each([
      {
        description: "valid xp breakdown",
        input: validBreakdown,
      },
    ] as const)("$description", ({ input }) => {
      expect(XpBreakdownSchema).toValidate(input);
    });
  });

  describe("PostResultResponseSchema", () => {
    const validResponse = {
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
    };
    it.each([
      {
        description: "valid post result response",
        input: validResponse,
      },
      {
        description: "invalid - xp is negative",
        input: { ...validResponse, xp: -1 },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PostResultResponseSchema).toReject(input, expectedError);
      } else {
        expect(PostResultResponseSchema).toValidate(input);
      }
    });
  });
});
