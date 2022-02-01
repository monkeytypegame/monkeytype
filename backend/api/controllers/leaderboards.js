const LeaderboardsDAO = require("../../dao/leaderboards");
const ResultDAO = require("../../dao/result");
const UserDAO = require("../../dao/user");
const admin = require("firebase-admin");
const { verifyIdToken } = require("../../handlers/auth");

class LeaderboardsController {
  static async get(req, res, next) {
    const { language, mode, mode2, skip, limit } = req.query;

    let uid;

    const { authorization } = req.headers;
    if (authorization) {
      const token = authorization.split(" ");
      if (token[0].trim() == "Bearer")
        req.decodedToken = await verifyIdToken(token[1]);
      uid = req.decodedToken.uid;
    }

    if (!language || !mode || !mode2 || !skip) {
      return res.status(400).json({
        message: "Missing parameters",
      });
    }
    let retval = await LeaderboardsDAO.get(mode, mode2, language, skip, limit);
    retval.forEach((item) => {
      if (uid && item.uid == uid) {
        //
      } else {
        delete item.discordId;
        delete item.uid;
        delete item.difficulty;
        delete item.language;
      }
    });
    return res.status(200).json(retval);
  }

  static async getRank(req, res, next) {
    const { language, mode, mode2 } = req.query;
    const { uid } = req.decodedToken;
    if (!language || !mode || !mode2 || !uid) {
      return res.status(400).json({
        message: "Missing parameters",
      });
    }
    let retval = await LeaderboardsDAO.getRank(mode, mode2, language, uid);
    return res.status(200).json(retval);
  }
}

module.exports = LeaderboardsController;
