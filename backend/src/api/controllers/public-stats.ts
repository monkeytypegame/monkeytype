import * as PublicStatsDAL from "../../dal/public-stats";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getPublicSpeedHistogram(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { language, mode, mode2 } = req.query;
  const data = await PublicStatsDAL.getSpeedHistogram(language, mode, mode2);
  return new MonkeyResponse("Public speed histogram retrieved", data);
}

export async function getPublicTypingStats(
  _req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const data = await PublicStatsDAL.getTypingStats();
  return new MonkeyResponse("Public typing stats retrieved", data);
}
