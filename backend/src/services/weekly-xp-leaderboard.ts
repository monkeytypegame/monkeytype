import * as RedisClient from "../init/redis";
import LaterQueue from "../queues/later-queue";
import { getCurrentWeekTimestamp } from "../utils/misc";

interface InternalWeeklyXpLeaderboardEntry {
  uid: string;
  name: string;
  discordAvatar?: string;
  discordId?: string;
  badgeId?: number;
  lastActivityTimestamp: number;
}

interface WeeklyXpLeaderboardEntry extends InternalWeeklyXpLeaderboardEntry {
  totalXp: number;
  rank: number;
  count?: number;
  timeTypedSeconds: number;
}

interface AddResultOpts {
  entry: InternalWeeklyXpLeaderboardEntry;
  xpGained: number;
  timeTypedSeconds: number;
}

const weeklyXpLeaderboardLeaderboardNamespace =
  "monkeytype:weekly-xp-leaderboard";
const scoresNamespace = `${weeklyXpLeaderboardLeaderboardNamespace}:scores`;
const resultsNamespace = `${weeklyXpLeaderboardLeaderboardNamespace}:results`;

export class WeeklyXpLeaderboard {
  private weeklyXpLeaderboardResultsKeyName: string;
  private weeklyXpLeaderboardScoresKeyName: string;
  private customTime: number;

  constructor(customTime = -1) {
    this.weeklyXpLeaderboardResultsKeyName = resultsNamespace;
    this.weeklyXpLeaderboardScoresKeyName = scoresNamespace;
    this.customTime = customTime;
  }

  private getThisWeeksXpLeaderboardKeys(): {
    currentWeekTimestamp: number;
    weeklyXpLeaderboardScoresKey: string;
    weeklyXpLeaderboardResultsKey: string;
  } {
    const currentWeekTimestamp =
      this.customTime === -1 ? getCurrentWeekTimestamp() : this.customTime;

    const weeklyXpLeaderboardScoresKey = `${this.weeklyXpLeaderboardScoresKeyName}:${currentWeekTimestamp}`;
    const weeklyXpLeaderboardResultsKey = `${this.weeklyXpLeaderboardResultsKeyName}:${currentWeekTimestamp}`;

    return {
      currentWeekTimestamp,
      weeklyXpLeaderboardScoresKey,
      weeklyXpLeaderboardResultsKey,
    };
  }

  public async addResult(
    weeklyXpLeaderboardConfig: MonkeyTypes.Configuration["leaderboards"]["weeklyXp"],
    opts: AddResultOpts
  ): Promise<number> {
    const { entry, xpGained, timeTypedSeconds } = opts;

    const connection = RedisClient.getConnection();
    if (!connection || !weeklyXpLeaderboardConfig.enabled) {
      return -1;
    }

    const {
      currentWeekTimestamp,
      weeklyXpLeaderboardScoresKey,
      weeklyXpLeaderboardResultsKey,
    } = this.getThisWeeksXpLeaderboardKeys();

    const { expirationTimeInDays } = weeklyXpLeaderboardConfig;
    const weeklyXpLeaderboardExpirationDurationInMilliseconds =
      expirationTimeInDays * 24 * 60 * 60 * 1000;

    const weeklyXpLeaderboardExpirationTimeInSeconds = Math.floor(
      (currentWeekTimestamp +
        weeklyXpLeaderboardExpirationDurationInMilliseconds) /
        1000
    );

    const currentEntry = await connection.hget(
      weeklyXpLeaderboardResultsKey,
      entry.uid
    );
    const totalTimeTypedSeconds =
      timeTypedSeconds +
      ((currentEntry && JSON.parse(currentEntry)?.timeTypedSeconds) || 0);

    const [rank]: [number, void] = await Promise.all([
      // @ts-ignore
      connection.addResultIncrement(
        2,
        weeklyXpLeaderboardScoresKey,
        weeklyXpLeaderboardResultsKey,
        weeklyXpLeaderboardExpirationTimeInSeconds,
        entry.uid,
        xpGained,
        JSON.stringify({ ...entry, timeTypedSeconds: totalTimeTypedSeconds })
      ),
      LaterQueue.scheduleForNextWeek(
        "weekly-xp-leaderboard-results",
        "weekly-xp"
      ),
    ]);

    return rank + 1;
  }

  public async getResults(
    minRank: number,
    maxRank: number,
    weeklyXpLeaderboardConfig: MonkeyTypes.Configuration["leaderboards"]["weeklyXp"]
  ): Promise<WeeklyXpLeaderboardEntry[]> {
    const connection = RedisClient.getConnection();
    if (!connection || !weeklyXpLeaderboardConfig.enabled) {
      return [];
    }

    const { weeklyXpLeaderboardScoresKey, weeklyXpLeaderboardResultsKey } =
      this.getThisWeeksXpLeaderboardKeys();

    // @ts-ignore
    const [results, scores]: string[][] = await connection.getResults(
      2, // How many of the arguments are redis keys (https://redis.io/docs/manual/programmability/lua-api/)
      weeklyXpLeaderboardScoresKey,
      weeklyXpLeaderboardResultsKey,
      minRank,
      maxRank,
      "true"
    );

    const resultsWithRanks: WeeklyXpLeaderboardEntry[] = results.map(
      (resultJSON: string, index: number) => ({
        ...JSON.parse(resultJSON),
        rank: minRank + index + 1,
        totalXp: parseInt(scores[index], 10),
      })
    );

    return resultsWithRanks;
  }

  public async getRank(
    uid: string,
    weeklyXpLeaderboardConfig: MonkeyTypes.Configuration["leaderboards"]["weeklyXp"]
  ): Promise<WeeklyXpLeaderboardEntry | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !weeklyXpLeaderboardConfig.enabled) {
      return null;
    }

    const { weeklyXpLeaderboardScoresKey, weeklyXpLeaderboardResultsKey } =
      this.getThisWeeksXpLeaderboardKeys();

    connection.set;

    const [[, rank], [, totalXp], [, count], [, result]] = await connection
      .multi()
      .zrevrank(weeklyXpLeaderboardScoresKey, uid)
      .zscore(weeklyXpLeaderboardScoresKey, uid)
      .zcard(weeklyXpLeaderboardScoresKey)
      .hget(weeklyXpLeaderboardResultsKey, uid)
      .exec();

    if (rank === null) {
      return null;
    }

    return {
      rank: rank + 1,
      count: count ?? 0,
      totalXp: parseInt(totalXp, 10),
      ...JSON.parse(result ?? "null"),
    };
  }
}

export function get(
  weeklyXpLeaderboardConfig: MonkeyTypes.Configuration["leaderboards"]["weeklyXp"],
  customTimestamp?: number
): WeeklyXpLeaderboard | null {
  const { enabled } = weeklyXpLeaderboardConfig;

  if (!enabled) {
    return null;
  }

  return new WeeklyXpLeaderboard(customTimestamp);
}
