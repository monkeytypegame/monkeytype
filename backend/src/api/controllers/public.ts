import {
  GetSpeedHistogramQuery,
  GetSpeedHistogramResponse,
  GetTypingStatsResponse,
} from "@monkeytype/contracts/public";
import * as PublicDAL from "../../dal/public";
import { MonkeyResponse } from "../../utils/monkey-response";
import { MonkeyRequest } from "../types";

export async function getSpeedHistogram(
  req: MonkeyRequest<GetSpeedHistogramQuery>
): Promise<GetSpeedHistogramResponse> {
  const { language, mode, mode2 } = req.query;
  const data = await PublicDAL.getSpeedHistogram(language, mode, mode2);
  return new MonkeyResponse("Public speed histogram retrieved", data);
}

export async function getTypingStats(
  _req: MonkeyRequest
): Promise<GetTypingStatsResponse> {
  const data = await PublicDAL.getTypingStats();
  return new MonkeyResponse("Public typing stats retrieved", data);
}
