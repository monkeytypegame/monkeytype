import { roundTo2 } from "../utils/misc";
import MonkeyError from "../utils/error";
import * as db from "../init/db";

type PublicTypingStatsDB = SharedTypes.PublicTypingStats & { _id: "stats" };
type PublicSpeedStatsDB = { _id: "speedStatsHistogram"; english_time_15: SharedTypes.SpeedHistogram; english_time_60: SharedTypes.SpeedHistogram; };

const updateStats = async (restartCount: number, time: number): Promise<boolean> => {
  await db.collection<PublicTypingStatsDB>("public").updateOne({ _id: "stats" }, { $inc: { testsCompleted: 1, testsStarted: restartCount + 1, timeTyping: roundTo2(time), }, }, { upsert: true });
  return true;
};

const getSpeedHistogram = async (language: string, mode: string, mode2: string): Promise<Record<string, number>> => {
  const key = `${language}_${mode}_${mode2}`;
  const stats = await db.collection<PublicSpeedStatsDB>("public").findOne({ _id: "speedStatsHistogram" }, { projection: { [key]: 1 } });
  return stats?.[key] ?? {};
};

const getTypingStats = async (): Promise<PublicTypingStatsDB> => {
  const stats = await db.collection<PublicTypingStatsDB>("public").findOne({ _id: "stats" }, { projection: { _id: 0 } });
  if (!stats) throw new MonkeyError(404, "Public typing stats not found", "get typing stats");
  return stats;
};

export { updateStats, getSpeedHistogram, getTypingStats };
