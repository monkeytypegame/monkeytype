import { Configuration } from "@monkeytype/schemas/configuration";
import * as RedisClient from "../init/redis";
import LaterQueue from "../queues/later-queue";
import {
  RedisXpLeaderboardEntry,
  RedisXpLeaderboardEntrySchema,
  RedisXpLeaderboardScore,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { getCurrentWeekTimestamp } from "@monkeytype/util/date-and-time";
import MonkeyError from "../utils/error";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { omit } from "../utils/misc";

export type AddResultOpts = {
  entry: RedisXpLeaderboardEntry;
  xpGained: RedisXpLeaderboardScore;
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
    const { entry, xpGained } = opts;

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
        ? parseJsonWithSchema(currentEntry, RedisXpLeaderboardEntrySchema)
            ?.timeTypedSeconds
        : undefined;

    const totalTimeTypedSeconds =
      entry.timeTypedSeconds + (currentEntryTimeTypedSeconds ?? 0);

    const [rank] = await Promise.all([
      connection.addResultIncrement(
        2,
        weeklyXpLeaderboardScoresKey,
        weeklyXpLeaderboardResultsKey,
        weeklyXpLeaderboardExpirationTimeInSeconds,
        entry.uid,
        xpGained,
        JSON.stringify(
          RedisXpLeaderboardEntrySchema.parse({
            ...entry,
            timeTypedSeconds: totalTimeTypedSeconds,
          })
        )
      ),
      LaterQueue.scheduleForNextWeek(
        "weekly-xp-leaderboard-results",
        "weekly-xp"
      ),
    ]);

    return rank + 1;
  }

  public async getResults(
    page: number,
    pageSize: number,
    weeklyXpLeaderboardConfig: Configuration["leaderboards"]["weeklyXp"],
    premiumFeaturesEnabled: boolean,
    userIds?: string[]
  ): Promise<{
    entries: XpLeaderboardEntry[];
    count: number;
  } | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !weeklyXpLeaderboardConfig.enabled) {
      return null;
    }

    if (page < 0 || pageSize < 0) {
      throw new MonkeyError(500, "Invalid page or pageSize");
    }

    if (userIds?.length === 0) {
      return { entries: [], count: 0 };
    }

    const isFriends = userIds !== undefined;
    const minRank = page * pageSize;
    const maxRank = minRank + pageSize - 1;

    const { weeklyXpLeaderboardScoresKey, weeklyXpLeaderboardResultsKey } =
      this.getThisWeeksXpLeaderboardKeys();

    const [results, scores, count, _, ranks] = await connection.getResults(
      2,
      weeklyXpLeaderboardScoresKey,
      weeklyXpLeaderboardResultsKey,
      minRank,
      maxRank,
      "true",
      userIds?.join(",") ?? ""
    );

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

    let resultsWithRanks: XpLeaderboardEntry[] = results.map(
      (resultJSON: string, index: number) => {
        try {
          const parsed = parseJsonWithSchema(
            resultJSON,
            RedisXpLeaderboardEntrySchema
          );
          const scoreValue = scores[index];

          if (typeof scoreValue !== "string") {
            throw new Error(
              `Invalid score value at index ${index}: ${scoreValue}`
            );
          }

          return {
            ...parsed,
            rank: isFriends
              ? new Number(ranks[index]).valueOf() + 1
              : minRank + index + 1,
            friendsRank: isFriends ? minRank + index + 1 : undefined,
            totalXp: parseInt(scoreValue, 10),
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
      resultsWithRanks = resultsWithRanks.map((it) => omit(it, ["isPremium"]));
    }

    return { entries: resultsWithRanks, count: parseInt(count) };
  }

  public async getRank(
    uid: string,
    weeklyXpLeaderboardConfig: Configuration["leaderboards"]["weeklyXp"],
    userIds?: string[]
  ): Promise<XpLeaderboardEntry | null> {
    const connection = RedisClient.getConnection();
    if (!connection || !weeklyXpLeaderboardConfig.enabled) {
      throw new Error("Redis connection is unavailable");
    }
    if (userIds?.length === 0) {
      return null;
    }

    const { weeklyXpLeaderboardScoresKey, weeklyXpLeaderboardResultsKey } =
      this.getThisWeeksXpLeaderboardKeys();

    const [rank, score, result, friendsRank] = await connection.getRank(
      2,
      weeklyXpLeaderboardScoresKey,
      weeklyXpLeaderboardResultsKey,
      uid,
      "true",
      userIds?.join(",") ?? ""
    );

    if (rank === null || result === null) {
      return null;
    }

    try {
      return {
        ...parseJsonWithSchema(result ?? "null", RedisXpLeaderboardEntrySchema),
        rank: rank + 1,
        friendsRank: friendsRank !== undefined ? friendsRank + 1 : undefined,
        totalXp: parseInt(score, 10),
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

export async function purgeUserFromXpLeaderboards(
  uid: string,
  weeklyXpLeaderboardConfig: Configuration["leaderboards"]["weeklyXp"]
): Promise<void> {
  const connection = RedisClient.getConnection();
  if (!connection || !weeklyXpLeaderboardConfig.enabled) {
    return;
  }

  await connection.purgeResults(
    0,
    uid,
    weeklyXpLeaderboardLeaderboardNamespace
  );
}

export const __testing = {
  namespace: weeklyXpLeaderboardLeaderboardNamespace,
};
