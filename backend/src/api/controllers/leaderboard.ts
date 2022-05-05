import _ from "lodash";
import { MonkeyResponse } from "../../utils/monkey-response";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import MonkeyError from "../../utils/error";

export async function getLeaderboard(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { language, mode, mode2, skip, limit = 50 } = req.query;
  const { uid } = req.ctx.decodedToken;

  const queryLimit = Math.min(parseInt(limit as string, 10), 50);

  const leaderboard = await LeaderboardsDAL.get(
    mode as string,
    mode2 as string,
    language as string,
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

  if (leaderboard.length === 0) {
    throw new MonkeyError(
      404,
      `No ${mode} ${mode2} leaderboard found`,
      `getLeaderboard${mode}${mode2}`,
      uid
    );
  }

  const normalizedLeaderboard = _.map(leaderboard, (entry) => {
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

  const data = await LeaderboardsDAL.getRank(
    mode as string,
    mode2 as string,
    language as string,
    uid
  );
  if (data === false) {
    return new MonkeyResponse(
      "Leaderboard is currently updating. Please try again in a few seconds.",
      null,
      503
    );
  }

  return new MonkeyResponse("Rank retrieved", data);
}
