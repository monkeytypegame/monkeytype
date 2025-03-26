import _, { omit } from "lodash";
import * as RedisClient from "../init/redis";
import LaterQueue from "../queues/later-queue";
import { matchesAPattern, kogascore } from "./misc";
import {
  Configuration,
  ValidModeRule,
} from "@monkeytype/contracts/schemas/configuration";
import { LeaderboardEntry } from "@monkeytype/contracts/schemas/leaderboards";
import MonkeyError from "./error";
import { Mode, Mode2 } from "@monkeytype/contracts/schemas/shared";
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
    entry: Omit<LeaderboardEntry, "rank">,
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

    // @ts-expect-error we are doing some weird file to function mapping, thats why its any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const rank = (await connection.addResult(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      maxResults,
      leaderboardExpirationTimeInSeconds,
      entry.uid,
      resultScore,
      JSON.stringify(entry)
    )) as number;

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
    premiumFeaturesEnabled: boolean
  ): Promise<LeaderboardEntry[]> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return [];
    }

    if (page < 0 || pageSize < 0) {
      throw new MonkeyError(500, "Invalid page or pageSize");
    }

    const minRank = page * pageSize;
    const maxRank = minRank + pageSize - 1;

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    // @ts-expect-error we are doing some weird file to function mapping, thats why its any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const [results, _] = (await connection.getResults(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      minRank,
      maxRank,
      "false"
    )) as [string[], string[]];

    if (results === undefined) {
      throw new Error(
        "Redis returned undefined when getting daily leaderboard results"
      );
    }

    const resultsWithRanks: LeaderboardEntry[] = results.map(
      (resultJSON, index) => {
        // TODO: parse with zod?
        const parsed = JSON.parse(resultJSON) as LeaderboardEntry;

        return {
          ...parsed,
          rank: minRank + index + 1,
        };
      }
    );

    if (!premiumFeaturesEnabled) {
      return resultsWithRanks.map((it) => omit(it, "isPremium"));
    }

    return resultsWithRanks;
  }

  public async getMinWpm(
    dailyLeaderboardsConfig: Configuration["dailyLeaderboards"]
  ): Promise<number> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return 0;
    }

    const { leaderboardScoresKey } = this.getTodaysLeaderboardKeys();

    const [_uid, minScore] = (await connection.zrange(
      leaderboardScoresKey,
      0,
      0,
      "WITHSCORES"
    )) as [string, string];

    const minWpm =
      minScore !== undefined ? parseInt(minScore?.slice(1, 6)) / 100 : 0;

    return minWpm;
  }

  public async getRank(
    uid: string,
    dailyLeaderboardsConfig: Configuration["dailyLeaderboards"]
  ): Promise<LeaderboardEntry | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      throw new MonkeyError(500, "Redis connnection is unavailable");
    }

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    const redisExecResult = (await connection
      .multi()
      .zrevrank(leaderboardScoresKey, uid)
      .zcard(leaderboardScoresKey)
      .hget(leaderboardResultsKey, uid)
      .exec()) as [
      [null, number | null],
      [null, number | null],
      [null, string | null]
    ];

    const [[, rank], [, _count], [, result]] = redisExecResult;

    if (rank === null) {
      return null;
    }

    return {
      ...(JSON.parse(result ?? "null") as LeaderboardEntry),
      rank: rank + 1,
    };
  }

  public async getCount(): Promise<number> {
    const connection = RedisClient.getConnection();
    if (!connection) {
      throw new MonkeyError(500, "Redis connnection is unavailable");
    }

    const { leaderboardScoresKey } = this.getTodaysLeaderboardKeys();

    return connection.zcard(leaderboardScoresKey);
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

  // @ts-expect-error we are doing some weird file to function mapping, thats why its any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
