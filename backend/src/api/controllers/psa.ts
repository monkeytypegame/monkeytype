import * as PsaDAL from "../../dal/psa";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getPsas(): Promise<MonkeyResponse<SharedTypes.PSA[]>> {
  const data = await PsaDAL.get();
  return MonkeyResponse.unwrapArray("PSAs retrieved", data);
}
