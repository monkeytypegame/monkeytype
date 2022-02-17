import { MonkeyResponse } from "../../handlers/monkey-response";
import _ from "lodash";
import LeaderboardsDAO from "../../dao/leaderboards";

class LeaderboardsController {
  static async get(req, _res) {
    const { language, mode, mode2, skip, limit } = req.query;
    const { uid } = req.ctx.decodedToken;

    const leaderboard = await LeaderboardsDAO.get(
      mode,
      mode2,
      language,
      skip,
      limit
    );

    const normalizedLeaderboard = _.map(leaderboard, (entry) => {
      return uid && entry.uid === uid
        ? entry
        : _.omit(entry, ["discordId", "uid", "difficulty", "language"]);
    });

    return new MonkeyResponse("Leaderboard retrieved", normalizedLeaderboard);
  }

  static async getRank(req, _res) {
    const { language, mode, mode2 } = req.query;
    const { uid } = req.ctx.decodedToken;
    const data = await LeaderboardsDAO.getRank(mode, mode2, language, uid);
    return new MonkeyResponse("Rank retrieved", data);
  }
}

export default LeaderboardsController;
