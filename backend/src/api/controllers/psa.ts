import { GetPsaResponse } from "@monkeytype/contracts/psas";
import * as PsaDAL from "../../dal/psa";
import { MonkeyResponse } from "../../utils/monkey-response";
import { replaceObjectIds } from "../../utils/misc";
import { MonkeyRequest } from "../types";
import { PSA } from "@monkeytype/schemas/psas";

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
let cached: PSA[] = [];
let lastFetchTime = 0;

export async function getPsas(_req: MonkeyRequest): Promise<GetPsaResponse> {
  return new MonkeyResponse("PSAs retrieved", await getCachedPsas());
}

async function getCachedPsas(): Promise<PSA[]> {
  if (lastFetchTime < Date.now() - UPDATE_INTERVAL) {
    lastFetchTime = Date.now();
    cached = replaceObjectIds(await PsaDAL.get());
  }

  return cached;
}
