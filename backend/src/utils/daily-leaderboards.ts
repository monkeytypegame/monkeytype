import _ from "lodash";
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
  ): Promise<void> {
    const connection = RedisClient.getConnection();
    if (!connection || !dailyLeaderboardsConfig.enabled) {
      return;
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
    await connection.addResult(
      2,
      leaderboardScoresKey,
      leaderboardResultsKey,
      maxResults,
      leaderboardExpirationTimeInSeconds,
      uid,
      entry.wpm,
      JSON.stringify(entry)
    );
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
    const normalizedResults: DailyLeaderboardEntry[] = _.map(
      results,
      (result) => {
        return JSON.parse(result);
      }
    ).sort(compareDailyLeaderboardEntries);

    return normalizedResults;
  }
}

const DAILY_LEADERBOARDS = {};

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

  if (!enabled || !isValidMode) {
    return null;
  }

  const key = `${language}:${mode}:${mode2}`;
  if (!DAILY_LEADERBOARDS[key]) {
    DAILY_LEADERBOARDS[key] = new DailyLeaderboard(language, mode, mode2);
  }

  return DAILY_LEADERBOARDS[key];
}
