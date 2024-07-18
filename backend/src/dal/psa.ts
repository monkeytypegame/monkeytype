import { PSA } from "@monkeytype/shared-types";
import * as db from "../init/db.js";

type DBPSA = MonkeyTypes.WithObjectId<PSA>;

export async function get(): Promise<DBPSA[]> {
  return await db.collection<DBPSA>("psa").find().toArray();
}
