import _ from "lodash";
import LRUCache from "lru-cache";
import * as RedisClient from "../init/redis";
import { getCurrentDayTimestamp, matchesAPattern } from "./misc";

interface DailyLeaderboardEntry {
  name: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  timestamp: number;
}

const dailyLeaderboardNamespace = "monkeytypes:dailyleaderboard";
const scoresNamespace = `${dailyLeaderboardNamespace}:scores`;
const resultsNamespace = `${dailyLeaderboardNamespace}:results`;

function compareDailyLeaderboardEntries(
  a: DailyLeaderboardEntry,
  b: DailyLeaderboardEntry
): number {
  if (a.wpm !== b.wpm) {
    return b.wpm - a.wpm;
  }

  if (a.accuracy !== b.accuracy) {
    return b.accuracy - a.accuracy;
  }

  return a.timestamp - b.timestamp;
}

class DailyLeaderboard {
  private leaderboardResultsKeyName: string;
  private leaderboardScoresKeyName: string;
  private leaderboardModeKey: string;

  constructor(language: string, mode: string, mode2: string) {
    this.leaderboardModeKey = `${language}:${mode}:${mode2}`;
    this.leaderboardResultsKeyName = `${resultsNamespace}:${this.leaderboardModeKey}`;
    this.leaderboardScoresKeyName = `${scoresNamespace}:${this.leaderboardModeKey}`;
  }

  public async addResult(
    uid: string,
    entry: DailyLeaderboardEntry,
    dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"]
  ): Promise<number> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return -1;
    }

    const currentDay = getCurrentDayTimestamp();
    const leaderboardResultsKey = `${this.leaderboardResultsKeyName}:${currentDay}`;
    const leaderboardScoresKey = `${this.leaderboardScoresKeyName}:${currentDay}`;

    const { maxResults, leaderboardExpirationTimeInDays } =
      dailyLeaderboardsConfig;
    const leaderboardExpirationDurationInMilliseconds =
      leaderboardExpirationTimeInDays * 24 * 60 * 60 * 1000;

    const leaderboardExpirationTimeInSeconds = Math.floor(
      (currentDay + leaderboardExpirationDurationInMilliseconds) / 1000
    );

    // @ts-ignore
    const rank = await connection.addResult(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      maxResults,
      leaderboardExpirationTimeInSeconds,
      uid,
      entry.wpm,
      JSON.stringify(entry)
    );

    return rank + (rank >= 0 ? 1 : 0);
  }

  public async getTopResults(
    dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"]
  ): Promise<DailyLeaderboardEntry[] | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return null;
    }

    const currentDay = getCurrentDayTimestamp();
    const leaderboardResultsKey = `${this.leaderboardResultsKeyName}:${currentDay}`;

    const results = await connection.hgetall(leaderboardResultsKey);

    const normalizedResults: DailyLeaderboardEntry[] = Object.values(results)
      .map((result) => JSON.parse(result))
      .sort(compareDailyLeaderboardEntries);

    return normalizedResults;
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
  dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"]
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

  const key = `${language}:${mode}:${mode2}`;

  if (!DAILY_LEADERBOARDS.has(key)) {
    const dailyLeaderboard = new DailyLeaderboard(language, mode, mode2);
    DAILY_LEADERBOARDS.set(key, dailyLeaderboard);
  }

  return DAILY_LEADERBOARDS.get(key) ?? null;
}
