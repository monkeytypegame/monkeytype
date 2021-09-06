const LeaderboardsDAO = require("../../dao/leaderboards");

class LeaderboardsController {
  static async get(req, res, next) {
    try {
      const { language, mode, mode2, skip, limit } = req.query;
      if (!language || !mode || !mode2 || !skip) {
        return res.status(400).json({
          message: "Missing parameters",
        });
      }
      let retval = await LeaderboardsDAO.get(
        mode,
        mode2,
        language,
        skip,
        limit
      );
      retval.forEach((item) => {
        delete item.uid;
      });
      return res.status(200).json(retval);
    } catch (e) {
      return next(e);
    }
  }

  static async getRank(req, res, next) {
    try {
      const { language, mode, mode2 } = req.query;
      const { uid } = req.decodedToken;
      if (!language || !mode || !mode2 || !uid) {
        return res.status(400).json({
          message: "Missing parameters",
        });
      }
      let retval = await LeaderboardsDAO.getRank(mode, mode2, language, uid);
      return res.status(200).json(retval);
    } catch (e) {
      return next(e);
    }
  }

  static async update(req, res, next) {
    try {
      const { language, mode, mode2 } = req.body;
      if (!language || !mode || !mode2) {
        return res.status(400).json({
          message: "Missing parameters",
        });
      }
      let retval = await LeaderboardsDAO.update(mode, mode2, language);
      return res.status(200).json(retval);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = LeaderboardsController;
