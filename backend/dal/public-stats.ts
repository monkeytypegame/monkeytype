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
