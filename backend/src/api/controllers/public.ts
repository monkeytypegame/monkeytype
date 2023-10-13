import * as PublicDAL from "../../dal/public";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getPublicSpeedHistogram(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { language, mode, mode2 } = req.query;
  const data = await PublicDAL.getSpeedHistogram(
    language as string,
    mode as string,
    mode2 as string
  );
  return new MonkeyResponse("Public speed histogram retrieved", data);
}

export async function getPublicTypingStats(
  _req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const data = await PublicDAL.getTypingStats();
  return new MonkeyResponse("Public typing stats retrieved", data);
}
