import * as db from "../init/db";

export async function get(): Promise<MonkeyTypes.PSA[]> {
  return await db.collection<MonkeyTypes.PSA>("psa").find().toArray();
}
