import _ from "lodash";
import LRUCache from "lru-cache";
import * as RedisClient from "../init/redis";
import LaterQueue from "../queues/later-queue";
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
  badgeId?: number;
}

const dailyLeaderboardNamespace = "monkeytype:dailyleaderboard";
const scoresNamespace = `${dailyLeaderboardNamespace}:scores`;
const resultsNamespace = `${dailyLeaderboardNamespace}:results`;

export class DailyLeaderboard {
  private leaderboardResultsKeyName: string;
  private leaderboardScoresKeyName: string;
  private leaderboardModeKey: string;
  private customTime: number;
  private modeRule: MonkeyTypes.ValidModeRule;

  constructor(modeRule: MonkeyTypes.ValidModeRule, customTime = -1) {
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
    dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"]
  ): Promise<DailyLeaderboardEntry[]> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return [];
    }

    const { leaderboardScoresKey, leaderboardResultsKey } =
      this.getTodaysLeaderboardKeys();

    // @ts-ignore
    const [results]: string[][] = await connection.getResults(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      minRank,
      maxRank,
      "false"
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

export async function purgeUserFromDailyLeaderboards(
  uid: string,
  configuration: MonkeyTypes.Configuration["dailyLeaderboards"]
): Promise<void> {
  const connection = RedisClient.getConnection();
  if (!connection || !configuration.enabled) {
    return;
  }

  // @ts-ignore
  await connection.purgeResults(0, uid, dailyLeaderboardNamespace);
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

function isValidModeRule(
  modeRule: MonkeyTypes.ValidModeRule,
  modeRules: MonkeyTypes.ValidModeRule[]
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
  dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"],
  customTimestamp = -1
): DailyLeaderboard | null {
  const { validModeRules, enabled } = dailyLeaderboardsConfig;

  const modeRule = { language, mode, mode2 };
  const isValidMode = isValidModeRule(modeRule, validModeRules);

  if (!enabled || !isValidMode || !DAILY_LEADERBOARDS) {
    return null;
  }

  const key = `${language}:${mode}:${mode2}:${customTimestamp}`;

  if (!DAILY_LEADERBOARDS.has(key)) {
    const dailyLeaderboard = new DailyLeaderboard(modeRule, customTimestamp);
    DAILY_LEADERBOARDS.set(key, dailyLeaderboard);
  }

  return DAILY_LEADERBOARDS.get(key) ?? null;
}
