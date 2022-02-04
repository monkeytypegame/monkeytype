const _ = require("lodash");
const LeaderboardsDAO = require("../../dao/leaderboards");
const { verifyIdToken } = require("../../handlers/auth");

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

    return normalizedLeaderboard;
  }

  static async getRank(req, res) {
    const { language, mode, mode2 } = req.query;
    const { uid } = req.ctx.decodedToken;

    if (!uid) {
      return res.status(400).json({
        message: "Missing user id.",
      });
    }

    return await LeaderboardsDAO.getRank(mode, mode2, language, uid);
  }
}

module.exports = LeaderboardsController;
