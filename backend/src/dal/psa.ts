import { Psa } from "@monkeytype/contracts/schemas/psas";
import * as db from "../init/db";

export type DBPSA = MonkeyTypes.WithObjectId<Psa>;

export async function get(): Promise<DBPSA[]> {
  return await db.collection<DBPSA>("psa").find().toArray();
}
