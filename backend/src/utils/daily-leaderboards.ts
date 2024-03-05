import _ from "lodash";
import * as RedisClient from "../init/redis";
import LaterQueue from "../queues/later-queue";
import { getCurrentDayTimestamp, matchesAPattern, kogascore } from "./misc";

type DailyLeaderboardEntry = {
  uid: string;
  name: string;
  wpm: number;
  raw: number;
  acc: number;
  consistency: number;
  timestamp: number;
  discordAvatar?: string;
  discordId?: string;
  badgeId?: number;
};

type GetRankResponse = {
  minWpm: number;
  count: number;
  rank: number | null;
  entry: DailyLeaderboardEntry | null;
};

export type LbEntryWithRank = {
  rank: number;
} & DailyLeaderboardEntry;

const dailyLeaderboardNamespace = "monkeytype:dailyleaderboard";
const scoresNamespace = `${dailyLeaderboardNamespace}:scores`;
const resultsNamespace = `${dailyLeaderboardNamespace}:results`;

export class DailyLeaderboard {
  private leaderboardResultsKeyName: string;
  private leaderboardScoresKeyName: string;
  private leaderboardModeKey: string;
  private customTime: number;
  private modeRule: SharedTypes.ValidModeRule;

  constructor(modeRule: SharedTypes.ValidModeRule, customTime = -1) {
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
    entry: DailyLeaderboardEntry,
    dailyLeaderboardsConfig: SharedTypes.Configuration["dailyLeaderboards"]
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

    // @ts-expect-error
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
    minRank: number,
    maxRank: number,
    dailyLeaderboardsConfig: SharedTypes.Configuration["dailyLeaderboards"]
  ): Promise<LbEntryWithRank[]> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return [];
    }

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    // @ts-expect-error
    const [results]: string[][] = await connection.getResults(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      minRank,
      maxRank,
      "false"
    );

    if (results === undefined) {
      throw new Error(
        "Redis returned undefined when getting daily leaderboard results"
      );
    }

    const resultsWithRanks: LbEntryWithRank[] = results.map(
      (resultJSON, index) => ({
        ...JSON.parse(resultJSON),
        rank: minRank + index + 1,
      })
    );

    return resultsWithRanks;
  }

  public async getRank(
    uid: string,
    dailyLeaderboardsConfig: SharedTypes.Configuration["dailyLeaderboards"]
  ): Promise<GetRankResponse | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return null;
    }

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    // @ts-expect-error
    const [[, rank], [, count], [, result], [, minScore]] = await connection
      .multi()
      .zrevrank(leaderboardScoresKey, uid)
      .zcard(leaderboardScoresKey)
      .hget(leaderboardResultsKey, uid)
      .zrange(leaderboardScoresKey, 0, 0, "WITHSCORES")
      .exec();

    const minWpm =
      minScore.length > 0 ? parseInt(minScore[1]?.slice(1, 6)) / 100 : 0;
    if (rank === null) {
      return {
        minWpm,
        count: count ?? 0,
        rank: null,
        entry: null,
      };
    }

    return {
      minWpm,
      count: count ?? 0,
      rank: rank + 1,
      entry: {
        ...JSON.parse(result ?? "null"),
      },
    };
  }
}

export async function purgeUserFromDailyLeaderboards(
  uid: string,
  configuration: SharedTypes.Configuration["dailyLeaderboards"]
): Promise<void> {
  const connection = RedisClient.getConnection();
  if (!connection || !configuration.enabled) {
    return;
  }

  // @ts-expect-error
  await connection.purgeResults(0, uid, dailyLeaderboardNamespace);
}

function isValidModeRule(
  modeRule: SharedTypes.ValidModeRule,
  modeRules: SharedTypes.ValidModeRule[]
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
  mode: string,
  mode2: string,
  dailyLeaderboardsConfig: SharedTypes.Configuration["dailyLeaderboards"],
  customTimestamp = -1
): DailyLeaderboard | null {
  const { validModeRules, enabled } = dailyLeaderboardsConfig;

  const modeRule = { language, mode, mode2 };
  const isValidMode = isValidModeRule(modeRule, validModeRules);

  if (!enabled || !isValidMode) {
    return null;
  }

  return new DailyLeaderboard(modeRule, customTimestamp);
}
