import { GetPsaResponse } from "@monkeytype/contracts/psas";
import * as PsaDAL from "../../dal/psa";
import { MonkeyResponse } from "../../utils/monkey-response";
import { replaceObjectIds } from "../../utils/misc";
import { MonkeyRequest } from "../types";
import { PSA } from "@monkeytype/schemas/psas";
import { loadingCache } from "../../utils/loadingCache";

//cache for one minute
const cache = loadingCache<PSA[]>(1 * 60 * 1000, async () => {
  return replaceObjectIds(await PsaDAL.get());
});

export async function getPsas(_req: MonkeyRequest): Promise<GetPsaResponse> {
  return new MonkeyResponse("PSAs retrieved", (await cache()) ?? []);
}
