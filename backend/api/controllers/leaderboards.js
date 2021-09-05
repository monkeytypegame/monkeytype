const LeaderboardsDAO = require("../../dao/leaderboards");

class LeaderboardsController {
  static async get(req, res, next) {
    try {
      const { language, mode, mode2 } = req.query;
      if (!language || !mode || !mode2) {
        return res.status(400).json({
          message: "Missing parameters",
        });
      }
      let retval = await LeaderboardsDAO.get(mode, mode2, language);
      retval.forEach((item) => {
        delete item.uid;
      });
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
