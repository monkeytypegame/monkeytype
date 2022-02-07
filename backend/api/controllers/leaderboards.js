const _ = require("lodash");
const LeaderboardsDAO = require("../../dao/leaderboards");
const { verifyIdToken } = require("../../handlers/auth");
const { MonkeyResponse } = require("../../middlewares/api-utils");
const MonkeyError = require("../../handlers/error");

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

    return new MonkeyResponse(
      200,
      "Get leaderboard successfully",
      normalizedLeaderboard
    );
  }

  static async getRank(req, res) {
    const { language, mode, mode2 } = req.query;
    const { uid } = req.ctx.decodedToken;

    if (!uid) {
      throw new MonkeyError(400, "Missing user id.");
    }

    const data = {
      mode,
      mode2,
      language,
      uid,
    };

    return new MonkeyResponse(200, "Get rank successfully", data);
  }
}

module.exports = LeaderboardsController;
