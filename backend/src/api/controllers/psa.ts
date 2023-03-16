import * as PsaDAL from "../../dal/psa";
import { MonkeyResponse } from "../../utils/monkey-response";
import { recordAdAbTest } from "../../utils/prometheus";

export async function getPsas(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { adChoice: adChoiceRaw } = req.query;

  //ensure adchoice raw is a string and either "pw" or "eg"
  const adChoice =
    typeof adChoiceRaw === "string" && ["pw", "eg"].includes(adChoiceRaw)
      ? adChoiceRaw
      : "unknown";

  recordAdAbTest(adChoice);

  const data = await PsaDAL.get();
  return new MonkeyResponse("PSAs retrieved", data);
}
