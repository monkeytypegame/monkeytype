import * as db from "../init/db";

type PSA = MonkeyTypes.WithObjectId<SharedTypes.PSA>;

export async function get(): Promise<PSA[]> {
  return await db.collection<PSA>("psa").find().toArray();
}
