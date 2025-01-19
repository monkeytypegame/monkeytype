import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import * as RedisClient from "../init/redis";
import LaterQueue from "../queues/later-queue";
import {
  XpLeaderboardEntry,
  XpLeaderboardRank,
} from "@monkeytype/contracts/schemas/leaderboards";
import { getCurrentWeekTimestamp } from "@monkeytype/util/date-and-time";

type AddResultOpts = {
  entry: Pick<
    XpLeaderboardEntry,
    | "uid"
    | "name"
    | "discordId"
    | "discordAvatar"
    | "badgeId"
    | "lastActivityTimestamp"
  >;
  xpGained: number;
  timeTypedSeconds: number;
};

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
    weeklyXpLeaderboardConfig: Configuration["leaderboards"]["weeklyXp"],
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

    const currentEntryTimeTypedSeconds =
      currentEntry !== null
        ? (JSON.parse(currentEntry) as { timeTypedSeconds: number | undefined })
            ?.timeTypedSeconds
        : undefined;

    const totalTimeTypedSeconds =
      timeTypedSeconds + (currentEntryTimeTypedSeconds ?? 0);

    const [rank] = await Promise.all([
      // @ts-expect-error we are doing some weird file to function mapping, thats why its any
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      connection.addResultIncrement(
        2,
        weeklyXpLeaderboardScoresKey,
        weeklyXpLeaderboardResultsKey,
        weeklyXpLeaderboardExpirationTimeInSeconds,
        entry.uid,
        xpGained,
        JSON.stringify({ ...entry, timeTypedSeconds: totalTimeTypedSeconds })
      ) as Promise<number>,
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
    weeklyXpLeaderboardConfig: Configuration["leaderboards"]["weeklyXp"]
  ): Promise<XpLeaderboardEntry[]> {
    const connection = RedisClient.getConnection();
    if (!connection || !weeklyXpLeaderboardConfig.enabled) {
      return [];
    }

    const { weeklyXpLeaderboardScoresKey, weeklyXpLeaderboardResultsKey } =
      this.getThisWeeksXpLeaderboardKeys();

    // @ts-expect-error we are doing some weird file to function mapping, thats why its any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const [results, scores] = (await connection.getResults(
      2, // How many of the arguments are redis keys (https://redis.io/docs/manual/programmability/lua-api/)
      weeklyXpLeaderboardScoresKey,
      weeklyXpLeaderboardResultsKey,
      minRank,
      maxRank,
      "true"
    )) as string[][];

    if (results === undefined) {
      throw new Error(
        "Redis returned undefined when getting weekly leaderboard results"
      );
    }

    if (scores === undefined) {
      throw new Error(
        "Redis returned undefined when getting weekly leaderboard scores"
      );
    }

    const resultsWithRanks: XpLeaderboardEntry[] = results.map(
      (resultJSON: string, index: number) => {
        //TODO parse with zod?
        const parsed = JSON.parse(resultJSON) as XpLeaderboardEntry;

        return {
          ...parsed,
          rank: minRank + index + 1,
          totalXp: parseInt(scores[index] as string, 10),
        };
      }
    );

    return resultsWithRanks;
  }

  public async getRank(
    uid: string,
    weeklyXpLeaderboardConfig: Configuration["leaderboards"]["weeklyXp"]
  ): Promise<XpLeaderboardRank | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !weeklyXpLeaderboardConfig.enabled) {
      return null;
    }

    const { weeklyXpLeaderboardScoresKey, weeklyXpLeaderboardResultsKey } =
      this.getThisWeeksXpLeaderboardKeys();

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    connection.set;

    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    const [[, rank], [, totalXp], [, count], [, result]] = (await connection
      .multi()
      .zrevrank(weeklyXpLeaderboardScoresKey, uid)
      .zscore(weeklyXpLeaderboardScoresKey, uid)
      .zcard(weeklyXpLeaderboardScoresKey)
      .hget(weeklyXpLeaderboardResultsKey, uid)
      .exec()) as [
      [null, number | null],
      [null, string | null],
      [null, number | null]
    ];

    if (rank === null) {
      return null;
    }

    //TODO parse with zod?
    const parsed = JSON.parse((result as string) ?? "null") as Omit<
      XpLeaderboardEntry,
      "rank" | "count" | "totalXp"
    >;

    return {
      rank: rank + 1,
      count: count ?? 0,
      totalXp: parseInt(totalXp as string, 10),
      ...parsed,
    };
  }
}

export function get(
  weeklyXpLeaderboardConfig: Configuration["leaderboards"]["weeklyXp"],
  customTimestamp?: number
): WeeklyXpLeaderboard | null {
  const { enabled } = weeklyXpLeaderboardConfig;

  if (!enabled) {
    return null;
  }

  return new WeeklyXpLeaderboard(customTimestamp);
}
