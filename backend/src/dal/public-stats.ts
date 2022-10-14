import * as db from "../init/db";
import { roundTo2 } from "../utils/misc";

export async function updateStats(
  restartCount: number,
  time: number
): Promise<boolean> {
  await db.collection<MonkeyTypes.PublicStats>("public").updateOne(
    { type: "stats" },
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
export async function getSpeedStats(
  language,
  mode,
  mode2
): Promise<Record<string, number>> {
  const key = `${language}_${mode}_${mode2}`;
  const stats = await db
    .collection<MonkeyTypes.PublicSpeedStats>("public")
    .findOne({ type: "speedStats" }, { projection: { [key]: 1 } });
  return stats?.[key] ?? {};
}
