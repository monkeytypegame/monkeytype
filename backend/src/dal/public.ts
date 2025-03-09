import { roundTo2 } from "@monkeytype/util/numbers";
import * as db from "../init/db";
import MonkeyError from "../utils/error";
import {
  TypingStats,
  SpeedHistogram,
} from "@monkeytype/contracts/schemas/public";

export type PublicTypingStatsDB = TypingStats & { _id: "stats" };
export type PublicSpeedStatsDB = {
  _id: "speedStatsHistogram";
  english_time_15: SpeedHistogram;
  english_time_60: SpeedHistogram;
};

export async function updateStats(
  restartCount: number,
  time: number
): Promise<boolean> {
  await db.collection<PublicTypingStatsDB>("public").updateOne(
    { _id: "stats" },
    {
      $inc: {
        testsCompleted: 1,
        testsStarted: restartCount + 1,
        timeTyping: roundTo2(time),
      },
    },
    { upsert: true }
  );
  return true;
}

/** Get the histogram stats of speed buckets for all users.
 * @returns an object mapping wpm => count, eg { '80': 4388, '90': 2149}
 */
export async function getSpeedHistogram(
  language: string,
  mode: string,
  mode2: string
): Promise<SpeedHistogram> {
  const key = `${language}_${mode}_${mode2}` as keyof PublicSpeedStatsDB;

  if (key === "_id") {
    throw new MonkeyError(
      400,
      "Invalid speed histogram key",
      "get speed histogram"
    );
  }

  const stats = await db
    .collection<PublicSpeedStatsDB>("public")
    .findOne({ _id: "speedStatsHistogram" }, { projection: { [key]: 1 } });

  return stats?.[key] ?? {};
}

/** Get typing stats such as total number of tests completed on site */
export async function getTypingStats(): Promise<PublicTypingStatsDB> {
  const stats = await db
    .collection<PublicTypingStatsDB>("public")
    .findOne({ _id: "stats" }, { projection: { _id: 0 } });
  if (!stats) {
    throw new MonkeyError(
      404,
      "Public typing stats not found",
      "get typing stats"
    );
  }
  return stats;
}
