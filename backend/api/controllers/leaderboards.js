const LeaderboardsDAO = require("../../dao/leaderboards");
const ResultDAO = require("../../dao/result");

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
      const { rid } = req.body;
      const { uid } = req.decodedToken;
      if (!rid) {
        return res.status(400).json({
          message: "Missing parameters",
        });
      }
      let result = await ResultDAO.getResult(uid, rid);
      if (!result.language) result.language = "english";
      if (
        result.mode == "time" &&
        result.isPb &&
        (result.mode2 == 15 || result.mode2 == 60) &&
        ["english"].includes(result.language)
      ) {
        //run update
        let retval = await LeaderboardsDAO.update(
          result.mode,
          result.mode2,
          result.language,
          uid
        );
        return res.status(200).json(retval);
      } else {
        return res.status(400).json({
          message: "This result is not eligible for any leaderboard",
        });
      }
    } catch (e) {
      return next(e);
    }
  }

  static async debugUpdate(req, res, next) {
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
