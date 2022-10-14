import * as PublicStatsDAL from "../../dal/public-stats";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getPublicSpeedStats(
  _req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { language, mode, mode2 } = _req.query;
  const data = await PublicStatsDAL.getSpeedStats(language, mode, mode2);
  return new MonkeyResponse("Public speed stats retrieved", data);
}
