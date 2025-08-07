import _, { omit } from "lodash";
import * as RedisClient from "../init/redis";
import LaterQueue from "../queues/later-queue";
import { matchesAPattern, kogascore } from "./misc";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import {
  Configuration,
  ValidModeRule,
} from "@monkeytype/schemas/configuration";
import {
  LeaderboardEntry,
  RedisDailyLeaderboardEntry,
  RedisDailyLeaderboardEntrySchema,
} from "@monkeytype/schemas/leaderboards";
import MonkeyError from "./error";
import { Mode, Mode2 } from "@monkeytype/schemas/shared";
import { getCurrentDayTimestamp } from "@monkeytype/util/date-and-time";

const dailyLeaderboardNamespace = "monkeytype:dailyleaderboard";
const scoresNamespace = `${dailyLeaderboardNamespace}:scores`;
const resultsNamespace = `${dailyLeaderboardNamespace}:results`;

export class DailyLeaderboard {
  private leaderboardResultsKeyName: string;
  private leaderboardScoresKeyName: string;
  private leaderboardModeKey: string;
  private customTime: number;
  private modeRule: ValidModeRule;

  constructor(modeRule: ValidModeRule, customTime = -1) {
    const { language, mode, mode2 } = modeRule;

    this.leaderboardModeKey = `${language}:${mode}:${mode2}`;
    this.leaderboardResultsKeyName = `${resultsNamespace}:${this.leaderboardModeKey}`;
    this.leaderboardScoresKeyName = `${scoresNamespace}:${this.leaderboardModeKey}`;
    this.customTime = customTime;
    this.modeRule = modeRule;
  }

  private getTodaysLeaderboardKeys(): {
    currentDayTimestamp: number;
    leaderboardScoresKey: string;
    leaderboardResultsKey: string;
  } {
    const currentDayTimestamp =
      this.customTime === -1 ? getCurrentDayTimestamp() : this.customTime;
    const leaderboardScoresKey = `${this.leaderboardScoresKeyName}:${currentDayTimestamp}`;
    const leaderboardResultsKey = `${this.leaderboardResultsKeyName}:${currentDayTimestamp}`;

    return {
      currentDayTimestamp,
      leaderboardScoresKey,
      leaderboardResultsKey,
    };
  }

  public async addResult(
    entry: RedisDailyLeaderboardEntry,
    dailyLeaderboardsConfig: Configuration["dailyLeaderboards"]
  ): Promise<number> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return -1;
    }

    const { currentDayTimestamp, leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    const { maxResults, leaderboardExpirationTimeInDays } =
      dailyLeaderboardsConfig;
    const leaderboardExpirationDurationInMilliseconds =
      leaderboardExpirationTimeInDays * 24 * 60 * 60 * 1000;

    const leaderboardExpirationTimeInSeconds = Math.floor(
      (currentDayTimestamp + leaderboardExpirationDurationInMilliseconds) / 1000
    );

    const resultScore = kogascore(entry.wpm, entry.acc, entry.timestamp);

    const rank = await connection.addResult(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      maxResults,
      leaderboardExpirationTimeInSeconds,
      entry.uid,
      resultScore,
      JSON.stringify(entry)
    );

    if (
      isValidModeRule(
        this.modeRule,
        dailyLeaderboardsConfig.scheduleRewardsModeRules
      )
    ) {
      await LaterQueue.scheduleForTomorrow(
        "daily-leaderboard-results",
        this.leaderboardModeKey,
        this.modeRule
      );
    }

    if (rank === null) {
      return -1;
    }

    return rank + 1;
  }

  public async getResults(
    page: number,
    pageSize: number,
    dailyLeaderboardsConfig: Configuration["dailyLeaderboards"],
    premiumFeaturesEnabled: boolean,
    userIds?: string[]
  ): Promise<{
    entries: LeaderboardEntry[];
    count: number;
    minWpm: number;
  } | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return null;
    }

    if (page < 0 || pageSize < 0) {
      throw new MonkeyError(500, "Invalid page or pageSize");
    }

    if (userIds?.length === 0) {
      return { entries: [], count: 0, minWpm: 0 };
    }

    const isFriends = userIds !== undefined;
    const minRank = page * pageSize;
    const maxRank = minRank + pageSize - 1;

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    const [results, _, count, [_uid, minScore], ranks] =
      await connection.getResults(
        2,
        leaderboardScoresKey,
        leaderboardResultsKey,
        minRank,
        maxRank,
        "false",
        userIds?.join(",") ?? ""
      );

    const minWpm =
      minScore !== undefined
        ? parseInt(minScore.toString()?.slice(1, 6)) / 100
        : 0;

    if (results === undefined) {
      throw new Error(
        "Redis returned undefined when getting daily leaderboard results"
      );
    }

    let resultsWithRanks: LeaderboardEntry[] = results.map(
      (resultJSON, index) => {
        try {
          const parsed = parseJsonWithSchema(
            resultJSON,
            RedisDailyLeaderboardEntrySchema
          );

          return {
            ...parsed,
            rank: isFriends
              ? new Number(ranks[index]).valueOf() + 1
              : minRank + index + 1,
            friendsRank: isFriends ? minRank + index + 1 : undefined,
          };
        } catch (error) {
          throw new Error(
            `Failed to parse leaderboard entry at index ${index}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    );

    if (!premiumFeaturesEnabled) {
      resultsWithRanks = resultsWithRanks.map((it) => omit(it, "isPremium"));
    }

    return { entries: resultsWithRanks, count: parseInt(count), minWpm };
  }

  public async getRank(
    uid: string,
    dailyLeaderboardsConfig: Configuration["dailyLeaderboards"],
    userIds?: string[]
  ): Promise<LeaderboardEntry | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      throw new Error("Redis connection is unavailable");
    }
    if (userIds?.length === 0) {
      return null;
    }

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    const [rank, _score, result] = await connection.getRank(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      uid,
      "false",
      userIds?.join(",") ?? ""
    );

    if (rank === null || rank === undefined) {
      return null;
    }

    try {
      return {
        ...parseJsonWithSchema(
          result ?? "null",
          RedisDailyLeaderboardEntrySchema
        ),
        rank: rank + 1,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse leaderboard entry: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

export async function purgeUserFromDailyLeaderboards(
  uid: string,
  configuration: Configuration["dailyLeaderboards"]
): Promise<void> {
  const connection = RedisClient.getConnection();
  if (!connection || !configuration.enabled) {
    return;
  }

  await connection.purgeResults(0, uid, dailyLeaderboardNamespace);
}

function isValidModeRule(
  modeRule: ValidModeRule,
  modeRules: ValidModeRule[]
): boolean {
  const { language, mode, mode2 } = modeRule;

  return modeRules.some((rule) => {
    const matchesLanguage = matchesAPattern(language, rule.language);
    const matchesMode = matchesAPattern(mode, rule.mode);
    const matchesMode2 = matchesAPattern(mode2, rule.mode2);
    return matchesLanguage && matchesMode && matchesMode2;
  });
}

export function getDailyLeaderboard(
  language: string,
  mode: Mode,
  mode2: Mode2<Mode>,
  dailyLeaderboardsConfig: Configuration["dailyLeaderboards"],
  customTimestamp = -1
): DailyLeaderboard | null {
  const { validModeRules, enabled } = dailyLeaderboardsConfig;

  const modeRule: ValidModeRule = { language, mode, mode2 };
  const isValidMode = isValidModeRule(modeRule, validModeRules);

  if (!enabled || !isValidMode) {
    return null;
  }

  return new DailyLeaderboard(modeRule, customTimestamp);
}

export const __testing = {
  namespace: dailyLeaderboardNamespace,
};
