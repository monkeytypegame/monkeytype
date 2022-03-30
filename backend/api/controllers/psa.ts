import PsaDAO from "../../dao/psa";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getPsas(
  _req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const data = await PsaDAO.get();
  return new MonkeyResponse("PSAs retrieved", data);
}
