import * as PsaDAL from "../../dal/psa.js";
import { MonkeyResponse } from "../../utils/monkey-response.js";

export async function getPsas(): Promise<MonkeyResponse> {
  const data = await PsaDAL.get();
  return new MonkeyResponse("PSAs retrieved", data);
}
