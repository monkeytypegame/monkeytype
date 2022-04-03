import _ from "lodash";
import { MonkeyResponse } from "../../utils/monkey-response";
import LeaderboardsDAO from "../../dao/leaderboards";

export async function getLeaderboard(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { language, mode, mode2, skip, limit = 50 } = req.query;
  const { uid } = req.ctx.decodedToken;

  const queryLimit = Math.min(parseInt(limit as string, 10), 50);

  const leaderboard = await LeaderboardsDAO.get(
    mode,
    mode2,
    language,
    parseInt(skip as string, 10),
    queryLimit
  );

  if (leaderboard === false) {
    return new MonkeyResponse(
      "Leaderboard is currently updating. Please try again in a few seconds.",
      null,
      503
    );
  }

  const normalizedLeaderboard = _.map(leaderboard as any[], (entry) => {
    return uid && entry.uid === uid
      ? entry
      : _.omit(entry, ["discordId", "uid", "difficulty", "language"]);
  });

  return new MonkeyResponse("Leaderboard retrieved", normalizedLeaderboard);
}

export async function getRankFromLeaderboard(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { language, mode, mode2 } = req.query;
  const { uid } = req.ctx.decodedToken;

  const data = await LeaderboardsDAO.getRank(mode, mode2, language, uid);
  if (data === false) {
    return new MonkeyResponse(
      "Leaderboard is currently updating. Please try again in a few seconds.",
      null,
      503
    );
  }

  return new MonkeyResponse("Rank retrieved", data);
}
