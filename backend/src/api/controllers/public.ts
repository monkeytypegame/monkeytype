import {
  GetSpeedHistogramQuery,
  GetSpeedHistogramResponse,
  GetTypingStatsResponse,
} from "@monkeytype/contracts/public";
import * as PublicDAL from "../../dal/public";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getSpeedHistogram(
  req: MonkeyTypes.Request<GetSpeedHistogramQuery>
): Promise<GetSpeedHistogramResponse> {
  const { language, mode, mode2 } = req.query;
  const data = await PublicDAL.getSpeedHistogram(language, mode, mode2);
  return new MonkeyResponse("Public speed histogram retrieved", data);
}

export async function getTypingStats(
  _req: MonkeyTypes.Request
): Promise<GetTypingStatsResponse> {
  const data = await PublicDAL.getTypingStats();
  return new MonkeyResponse("Public typing stats retrieved", data);
}
