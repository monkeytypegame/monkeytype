import _ from "lodash";
import * as pb from "../../src/utils/pb";
import { Mode, PersonalBests } from "@monkeytype/contracts/schemas/shared";
import { Result } from "@monkeytype/contracts/schemas/results";

describe("Pb Utils", () => {
  it("funboxCatGetPb", () => {
    const testCases = [
      {
        funbox: "plus_one",
        expected: true,
      },
      {
        funbox: "none",
        expected: true,
      },
      {
        funbox: "nausea#plus_one",
        expected: true,
      },
      {
        funbox: "arrows",
        expected: false,
      },
    ];

    _.each(testCases, (testCase) => {
      const { funbox, expected } = testCase;
      //@ts-ignore ignore because this expects a whole result object
      const result = pb.canFunboxGetPb({
        funbox,
      });

      expect(result).toBe(expected);
    });
  });
  describe("checkAndUpdatePb", () => {
    it("should update personal best", () => {
      const userPbs: PersonalBests = {
        time: {},
        words: {},
        custom: {},
        quote: {},
        zen: {},
      };
      const result = {
        difficulty: "normal",
        language: "english",
        punctuation: false,
        lazyMode: false,
        acc: 100,
        consistency: 100,
        rawWpm: 100,
        wpm: 110,
        numbers: false,
        mode: "time",
        mode2: "15",
      } as unknown as Result<Mode>;

      const run = pb.checkAndUpdatePb(
        userPbs,
        {} as pb.LbPersonalBests,
        result
      );

      expect(run.isPb).toBe(true);
      expect(run.personalBests?.["time"]?.["15"]?.[0]).not.toBe(undefined);
      expect(run.lbPersonalBests).not.toBe({});
    });
    it("should not override default pb when saving numbers test", () => {
      const userPbs: PersonalBests = {
        time: {
          "15": [
            {
              acc: 100,
              consistency: 100,
              difficulty: "normal",
              lazyMode: false,
              language: "english",
              numbers: false,
              punctuation: false,
              raw: 100,
              timestamp: 0,
              wpm: 100,
            },
          ],
        },
        words: {},
        custom: {},
        quote: {},
        zen: {},
      };
      const result = {
        difficulty: "normal",
        language: "english",
        punctuation: false,
        lazyMode: false,
        acc: 100,
        consistency: 100,
        rawWpm: 100,
        wpm: 110,
        numbers: true,
        mode: "time",
        mode2: "15",
      } as unknown as Result<Mode>;

      const run = pb.checkAndUpdatePb(userPbs, undefined, result);

      expect(run.isPb).toBe(true);

      expect(run.personalBests?.["time"]?.["15"]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ numbers: false, wpm: 100 }),
          expect.objectContaining({ numbers: true, wpm: 110 }),
        ])
      );
    });
  });
  describe("updateLeaderboardPersonalBests", () => {
    const userPbs: PersonalBests = {
      time: {
        "15": [
          {
            acc: 100,
            consistency: 100,
            difficulty: "normal",
            lazyMode: false,
            language: "english",
            numbers: false,
            punctuation: false,
            raw: 100,
            timestamp: 0,
            wpm: 100,
          },
          {
            acc: 100,
            consistency: 100,
            difficulty: "normal",
            lazyMode: false,
            language: "spanish",
            numbers: false,
            punctuation: false,
            raw: 100,
            timestamp: 0,
            wpm: 100,
          },
        ],
      },
      words: {},
      custom: {},
      quote: {},
      zen: {},
    };
    it("should update leaderboard personal bests if they dont exist or the structure is incomplete", () => {
      const lbpbstartingvalues = [
        undefined,
        {},
        { time: {} },
        { time: { "15": {} } },
        { time: { "15": { english: {} } } },
      ];

      const result15 = {
        mode: "time",
        mode2: "15",
      } as unknown as Result<Mode>;

      for (const lbPb of lbpbstartingvalues) {
        const lbPbPb = pb.updateLeaderboardPersonalBests(
          userPbs,
          _.cloneDeep(lbPb) as pb.LbPersonalBests,
          result15
        );

        expect(lbPbPb).toEqual({
          time: {
            "15": {
              english: {
                acc: 100,
                consistency: 100,
                difficulty: "normal",
                lazyMode: false,
                language: "english",
                numbers: false,
                punctuation: false,
                raw: 100,
                timestamp: 0,
                wpm: 100,
              },
              spanish: {
                acc: 100,
                consistency: 100,
                difficulty: "normal",
                lazyMode: false,
                language: "spanish",
                numbers: false,
                punctuation: false,
                raw: 100,
                timestamp: 0,
                wpm: 100,
              },
            },
          },
        });
      }
    });
  });
});
