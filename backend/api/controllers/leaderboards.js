const LeaderboardsDAO = require("../../dao/leaderboards");
const ResultDAO = require("../../dao/result");
const UserDAO = require("../../dao/user");
const admin = require("firebase-admin");
const { verifyIdToken } = require("../../handlers/auth");

class LeaderboardsController {
  static async get(req, res, next) {
    try {
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
      let retval = await LeaderboardsDAO.get(
        mode,
        mode2,
        language,
        skip,
        limit
      );
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
      return res.status(200).json({
        message: "Leaderboards disabled",
        lbdisabled: true,
      });
      if (process.env.LBDISABLED === true) {
        return res.status(200).json({
          message: "Leaderboards disabled",
          lbdisabled: true,
        });
      }
      const { rid } = req.body;
      const { uid } = req.decodedToken;
      if (!rid) {
        return res.status(400).json({
          message: "Missing parameters",
        });
      }
      //verify user first
      let user = await UserDAO.getUser(uid);
      if (!user) {
        return res.status(400).json({
          message: "User not found",
        });
      }
      if (user.banned === true) {
        return res.status(200).json({
          message: "User banned",
          banned: true,
        });
      }
      let userauth = await admin.auth().getUser(uid);
      if (!userauth.emailVerified) {
        return res.status(200).json({
          message: "User needs to verify email address",
          needsToVerifyEmail: true,
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
        //check if its better than their current lb pb
        let lbpb =
          user?.lbPersonalBests?.[result.mode]?.[result.mode2]?.[
            result.language
          ]?.wpm;
        if (!lbpb) lbpb = 0;
        if (result.wpm >= lbpb) {
          //run update
          let retval = await LeaderboardsDAO.update(
            result.mode,
            result.mode2,
            result.language,
            uid
          );
          if (retval.rank) {
            await UserDAO.updateLbMemory(
              uid,
              result.mode,
              result.mode2,
              result.language,
              retval.rank
            );
          }
          return res.status(200).json(retval);
        } else {
          let rank = await LeaderboardsDAO.getRank(
            result.mode,
            result.mode2,
            result.language,
            uid
          );
          rank = rank?.rank;
          if (!rank) {
            return res.status(400).json({
              message: "User has a lbPb but was not found on the leaderboard",
            });
          }
          await UserDAO.updateLbMemory(
            uid,
            result.mode,
            result.mode2,
            result.language,
            rank
          );
          return res.status(200).json({
            message: "Not a new leaderboard personal best",
            rank,
          });
        }
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
