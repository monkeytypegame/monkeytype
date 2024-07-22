import * as PsaDAL from "../../dal/psa";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getPsas(): Promise<MonkeyResponse> {
  const data = await PsaDAL.get();
  return new MonkeyResponse("PSAs retrieved", data);
}
