import { GetPsaResponse } from "@monkeytype/contracts/psas";
import * as PsaDAL from "../../dal/psa";
import { MonkeyResponse } from "../../utils/monkey-response";
import { replaceObjectIds } from "../../utils/misc";

export async function getPsas(
  _req: MonkeyTypes.Request
): Promise<GetPsaResponse> {
  const data = await PsaDAL.get();
  return new MonkeyResponse("PSAs retrieved", replaceObjectIds(data));
}
