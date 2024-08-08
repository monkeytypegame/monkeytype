import { GetPsaResponse } from "@monkeytype/contracts/psas";
import * as PsaDAL from "../../dal/psa";
import { MonkeyResponse2 } from "../../utils/monkey-response";
import { replaceObjectIds } from "../../utils/misc";

export async function getPsas(
  _req: MonkeyTypes.Request2
): Promise<GetPsaResponse> {
  const data = await PsaDAL.get();
  return new MonkeyResponse2("PSAs retrieved", replaceObjectIds(data));
}
