import * as RedisClient from "../init/redis";
import { getCurrentWeekTimestamp } from "../utils/misc";

interface InternalWeeklySeasonEntry {
  uid: string;
  name: string;
  discordAvatar?: string;
  discordId?: string;
  badgeId?: number;
  lastActivityTimestamp: number;
}

interface WeeklySeasonEntry extends InternalWeeklySeasonEntry {
  totalXp: number;
  rank: number;
  count?: number;
  timeTypedSeconds: number;
}

interface AddResultOpts {
  entry: InternalWeeklySeasonEntry;
  xpGained: number;
  timeTypedSeconds: number;
}

const weeklySeasonLeaderboardNamespace = "monkeytypes:weekly-season";
const scoresNamespace = `${weeklySeasonLeaderboardNamespace}:scores`;
const resultsNamespace = `${weeklySeasonLeaderboardNamespace}:results`;

export class WeeklySeason {
  private seasonResultsKeyName: string;
  private seasonScoresKeyName: string;
  private customTime: number;

  constructor(customTime = -1) {
    this.seasonResultsKeyName = resultsNamespace;
    this.seasonScoresKeyName = scoresNamespace;
    this.customTime = customTime;
  }

  private getThisWeeksSeasonKeys(): {
    currentWeekTimestamp: number;
    seasonScoresKey: string;
    seasonResultsKey: string;
  } {
    const currentWeekTimestamp =
      this.customTime === -1 ? getCurrentWeekTimestamp() : this.customTime;

    const seasonScoresKey = `${this.seasonScoresKeyName}:${currentWeekTimestamp}`;
    const seasonResultsKey = `${this.seasonResultsKeyName}:${currentWeekTimestamp}`;

    return {
      currentWeekTimestamp,
      seasonScoresKey,
      seasonResultsKey,
    };
  }

  public async addResult(
    weeklySeasonConfig: MonkeyTypes.Configuration["seasons"]["weekly"],
    opts: AddResultOpts
  ): Promise<number> {
    const { entry, xpGained, timeTypedSeconds } = opts;

    const connection = RedisClient.getConnection();
    if (!connection || !weeklySeasonConfig.enabled) {
      return -1;
    }

    const { currentWeekTimestamp, seasonScoresKey, seasonResultsKey } =
      this.getThisWeeksSeasonKeys();

    const { expirationTimeInDays } = weeklySeasonConfig;
    const seasonExpirationDurationInMilliseconds =
      expirationTimeInDays * 24 * 60 * 60 * 1000;

    const seasonExpirationTimeInSeconds = Math.floor(
      (currentWeekTimestamp + seasonExpirationDurationInMilliseconds) / 1000
    );

    const currentEntry = await connection.hget(seasonResultsKey, entry.uid);
    const totalTimeTypedSeconds =
      timeTypedSeconds +
      ((currentEntry && JSON.parse(currentEntry)?.timeTypedSeconds) || 0);

    // @ts-ignore
    const rank: number = await connection.addSeasonResult(
      2,
      seasonScoresKey,
      seasonResultsKey,
      seasonExpirationTimeInSeconds,
      entry.uid,
      xpGained,
      JSON.stringify({ ...entry, timeTypedSeconds: totalTimeTypedSeconds })
    );

    return rank + 1;
  }

  public async getResults(
    minRank: number,
    maxRank: number,
    weeklySeasonConfig: MonkeyTypes.Configuration["seasons"]["weekly"]
  ): Promise<WeeklySeasonEntry[]> {
    const connection = RedisClient.getConnection();
    if (!connection || !weeklySeasonConfig.enabled) {
      return [];
    }

    const { seasonScoresKey, seasonResultsKey } = this.getThisWeeksSeasonKeys();

    // @ts-ignore
    const [results, scores]: string[][] = await connection.getResults(
      2, // How many of the arguments are redis keys (https://redis.io/docs/manual/programmability/lua-api/)
      seasonScoresKey,
      seasonResultsKey,
      minRank,
      maxRank,
      "true"
    );

    const resultsWithRanks: WeeklySeasonEntry[] = results.map(
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
    weeklySeasonConfig: MonkeyTypes.Configuration["seasons"]["weekly"]
  ): Promise<WeeklySeasonEntry | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !weeklySeasonConfig.enabled) {
      return null;
    }

    const { seasonScoresKey, seasonResultsKey } = this.getThisWeeksSeasonKeys();

    connection.set;

    const [[, rank], [, totalXp], [, count], [, result]] = await connection
      .multi()
      .zrevrank(seasonScoresKey, uid)
      .zscore(seasonScoresKey, uid)
      .zcard(seasonScoresKey)
      .hget(seasonResultsKey, uid)
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

export function getWeeklySeason(
  weeklySeasonConfig: MonkeyTypes.Configuration["seasons"]["weekly"],
  customTimestamp?: number
): WeeklySeason | null {
  const { enabled } = weeklySeasonConfig;

  if (!enabled) {
    return null;
  }

  return new WeeklySeason(customTimestamp);
}
