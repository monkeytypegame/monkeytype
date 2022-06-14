import _ from "lodash";
import LRUCache from "lru-cache";
import * as RedisClient from "../init/redis";
import { getCurrentDayTimestamp, matchesAPattern, kogascore } from "./misc";

interface DailyLeaderboardEntry {
  uid: string;
  name: string;
  wpm: number;
  raw: number;
  acc: number;
  consistency: number;
  timestamp: number;
  rank?: number;
  count?: number;
  discordAvatar?: string;
  discordId?: string;
  badgeIds?: number[];
}

const dailyLeaderboardNamespace = "monkeytypes:dailyleaderboard";
const scoresNamespace = `${dailyLeaderboardNamespace}:scores`;
const resultsNamespace = `${dailyLeaderboardNamespace}:results`;

export class DailyLeaderboard {
  private leaderboardResultsKeyName: string;
  private leaderboardScoresKeyName: string;
  private leaderboardModeKey: string;
  private customTime: number;

  constructor(language: string, mode: string, mode2: string, customTime = -1) {
    this.leaderboardModeKey = `${language}:${mode}:${mode2}`;
    this.leaderboardResultsKeyName = `${resultsNamespace}:${this.leaderboardModeKey}`;
    this.leaderboardScoresKeyName = `${scoresNamespace}:${this.leaderboardModeKey}`;
    this.customTime = customTime;
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
    dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"]
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

    // @ts-ignore
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

    if (rank === null) {
      return -1;
    }

    return rank + 1;
  }

  public async getResults(
    minRank: number,
    maxRank: number,
    dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"]
  ): Promise<DailyLeaderboardEntry[]> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return [];
    }

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    // @ts-ignore
    const results: string[] = await connection.getResults(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      minRank,
      maxRank
    );

    const resultsWithRanks: DailyLeaderboardEntry[] = results.map(
      (resultJSON, index) => ({
        ...JSON.parse(resultJSON),
        rank: minRank + index + 1,
      })
    );

    return resultsWithRanks;
  }

  public async getRank(
    uid: string,
    dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"]
  ): Promise<DailyLeaderboardEntry | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return null;
    }

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    const [[, rank], [, count], [, result]] = await connection
      .multi()
      .zrevrank(leaderboardScoresKey, uid)
      .zcard(leaderboardScoresKey)
      .hget(leaderboardResultsKey, uid)
      .exec();

    if (rank === null) {
      return null;
    }

    return {
      rank: rank + 1,
      count: count ?? 0,
      ...JSON.parse(result ?? "null"),
    };
  }
}

let DAILY_LEADERBOARDS: LRUCache<string, DailyLeaderboard>;

export function initializeDailyLeaderboardsCache(
  configuration: MonkeyTypes.Configuration["dailyLeaderboards"]
): void {
  const { dailyLeaderboardCacheSize } = configuration;

  DAILY_LEADERBOARDS = new LRUCache({
    max: dailyLeaderboardCacheSize,
  });
}

export function getDailyLeaderboard(
  language: string,
  mode: string,
  mode2: string,
  dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"],
  customTimestamp = -1
): DailyLeaderboard | null {
  const { validModeRules, enabled } = dailyLeaderboardsConfig;

  const isValidMode = validModeRules.some((rule) => {
    const matchesLanguage = matchesAPattern(language, rule.language);
    const matchesMode = matchesAPattern(mode, rule.mode);
    const matchesMode2 = matchesAPattern(mode2, rule.mode2);
    return matchesLanguage && matchesMode && matchesMode2;
  });

  if (!enabled || !isValidMode || !DAILY_LEADERBOARDS) {
    return null;
  }

  const key = `${language}:${mode}:${mode2}:${customTimestamp}`;

  if (!DAILY_LEADERBOARDS.has(key)) {
    const dailyLeaderboard = new DailyLeaderboard(
      language,
      mode,
      mode2,
      customTimestamp
    );
    DAILY_LEADERBOARDS.set(key, dailyLeaderboard);
  }

  return DAILY_LEADERBOARDS.get(key) ?? null;
}
