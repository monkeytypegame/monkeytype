const ResultDAO = require("../../dao/result");
const UserDAO = require("../../dao/user");
const PublicStatsDAO = require("../../dao/public-stats");
const BotDAO = require("../../dao/bot");
const {
  validateObjectValues,
  validateResult,
} = require("../../handlers/validation");
const { stdDev, roundTo2 } = require("../../handlers/misc");
const objecthash = require("object-hash");
const Logger = require("../../handlers/logger");

class ResultController {
  static async getResults(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const results = await ResultDAO.getResults(uid);
      return res.status(200).json(results);
    } catch (e) {
      next(e);
    }
  }

  static async deleteAll(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      await ResultDAO.deleteAll(uid);
      Logger.log("user_results_deleted", "", uid);
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  static async updateTags(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { tags, resultid } = req.body;
      await ResultDAO.updateTags(uid, resultid, tags);
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  static async addResult(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { result } = req.body;
      result.uid = uid;
      if (validateObjectValues(result) > 0)
        return res.status(400).json({ message: "Bad input" });
      if (
        result.wpm <= 0 ||
        result.wpm > 350 ||
        result.acc < 75 ||
        result.acc > 100 ||
        result.consistency > 100
      ) {
        return res.status(400).json({ message: "Bad input" });
      }
      if (result.wpm == result.raw && result.acc != 100) {
        return res.status(400).json({ message: "Bad input" });
      }
      if (
        (result.mode === "time" && result.mode2 < 15 && result.mode2 > 0) ||
        (result.mode === "time" &&
          result.mode2 == 0 &&
          result.testDuration < 15) ||
        (result.mode === "words" && result.mode2 < 10 && result.mode2 > 0) ||
        (result.mode === "words" &&
          result.mode2 == 0 &&
          result.testDuration < 15) ||
        (result.mode === "custom" &&
          result.customText !== undefined &&
          !result.customText.isWordRandom &&
          !result.customText.isTimeRandom &&
          result.customText.textLen < 10) ||
        (result.mode === "custom" &&
          result.customText !== undefined &&
          result.customText.isWordRandom &&
          !result.customText.isTimeRandom &&
          result.customText.word < 10) ||
        (result.mode === "custom" &&
          result.customText !== undefined &&
          !result.customText.isWordRandom &&
          result.customText.isTimeRandom &&
          result.customText.time < 15)
      ) {
        return res.status(400).json({ message: "Test too short" });
      }
      if (!validateResult(result)) {
        return res
          .status(400)
          .json({ message: "Result data doesn't make sense" });
      }

      let resulthash = result.hash;
      delete result.hash;
      const serverhash = objecthash(result);
      if (serverhash !== resulthash) {
        Logger.log(
          "incorrect_result_hash",
          {
            serverhash,
            resulthash,
            result,
          },
          uid
        );
        return res.status(400).json({ message: "Incorrect result hash" });
      }

      result.timestamp = Math.round(result.timestamp / 1000) * 1000;

      //dont use - result timestamp is unreliable, can be changed by system time and stuff
      // if (result.timestamp > Math.round(Date.now() / 1000) * 1000 + 10) {
      //   Logger.log(
      //     "time_traveler",
      //     {
      //       resultTimestamp: result.timestamp,
      //       serverTimestamp: Math.round(Date.now() / 1000) * 1000 + 10,
      //     },
      //     uid
      //   );
      //   return res.status(400).json({ message: "Time traveler detected" });

      // this probably wont work if we replace the timestamp with the server time later
      // let timestampres = await ResultDAO.getResultByTimestamp(
      //   uid,
      //   result.timestamp
      // );
      // if (timestampres) {
      //   return res.status(400).json({ message: "Duplicate result" });
      // }

      //convert result test duration to miliseconds
      const testDurationMilis = result.testDuration * 1000;
      //get latest result ordered by timestamp
      let lastResultTimestamp;
      try {
        lastResultTimestamp =
          (await ResultDAO.getLastResult(uid)).timestamp - 1000;
      } catch (e) {
        lastResultTimestamp = null;
      }

      result.timestamp = Math.round(Date.now() / 1000) * 1000;

      //check if its greater than server time - milis or result time - milis
      if (
        lastResultTimestamp &&
        (lastResultTimestamp + testDurationMilis > result.timestamp ||
          lastResultTimestamp + testDurationMilis >
            Math.round(Date.now() / 1000) * 1000)
      ) {
        Logger.log(
          "invalid_result_spacing",
          {
            lastTimestamp: lastResultTimestamp,
            resultTime: result.timestamp,
            difference:
              lastResultTimestamp + testDurationMilis - result.timestamp,
          },
          uid
        );
        return res.status(400).json({ message: "Invalid result spacing" });
      }

      try {
        result.keySpacingStats = {
          average:
            result.keySpacing.reduce(
              (previous, current) => (current += previous)
            ) / result.keySpacing.length,
          sd: stdDev(result.keySpacing),
        };
      } catch (e) {
        //
      }
      try {
        result.keyDurationStats = {
          average:
            result.keyDuration.reduce(
              (previous, current) => (current += previous)
            ) / result.keyDuration.length,
          sd: stdDev(result.keyDuration),
        };
      } catch (e) {
        //
      }

      const user = await UserDAO.getUser(uid);
      // result.name = user.name;

      //check keyspacing and duration here for bots
      if (
        result.mode === "time" &&
        result.wpm > 130 &&
        result.testDuration < 122
      ) {
        if (user.verified === false || user.verified === undefined) {
          if (
            result.keySpacingStats !== null &&
            result.keyDurationStats !== null
          ) {
            if (
              result.keySpacingStats.sd <= 15 ||
              result.keyDurationStats.sd <= 10 ||
              result.keyDurationStats.average < 15 ||
              (result.wpm > 200 && result.consistency < 70)
            ) {
              //possible bot
              Logger.log(
                "anticheat_triggered",
                {
                  durationSD: result.keyDurationStats.sd,
                  durationAvg: result.keyDurationStats.average,
                  spacingSD: result.keySpacingStats.sd,
                  spacingAvg: result.keySpacingStats.average,
                  wpm: result.wpm,
                  acc: result.acc,
                  consistency: result.consistency,
                },
                uid
              );
              return res.status(400).json({ message: "Possible bot detected" });
            }
            if (
              (result.keySpacingStats.sd > 15 &&
                result.keySpacingStats.sd <= 25) ||
              (result.keyDurationStats.sd > 10 &&
                result.keyDurationStats.sd <= 15) ||
              (result.keyDurationStats.average > 15 &&
                result.keyDurationStats.average <= 20)
            ) {
              //close to the bot detection threshold
              Logger.log(
                "anticheat_close",
                {
                  durationSD: result.keyDurationStats.sd,
                  durationAvg: result.keyDurationStats.average,
                  spacingSD: result.keySpacingStats.sd,
                  spacingAvg: result.keySpacingStats.average,
                  wpm: result.wpm,
                  acc: result.acc,
                  consistency: result.consistency,
                },
                uid
              );
            }
          } else {
            return res.status(400).json({ message: "Missing key data" });
          }
        }
      }

      delete result.keySpacing;
      delete result.keyDuration;

      try {
        result.keyDurationStats.average = roundTo2(
          result.keyDurationStats.average
        );
        result.keyDurationStats.sd = roundTo2(result.keyDurationStats.sd);
        result.keySpacingStats.average = roundTo2(
          result.keySpacingStats.average
        );
        result.keySpacingStats.sd = roundTo2(result.keySpacingStats.sd);
      } catch (e) {
        //
      }

      let isPb = false;
      let tagPbs = [];

      if (!result.bailedOut) {
        isPb = await UserDAO.checkIfPb(uid, result);
        tagPbs = await UserDAO.checkIfTagPb(uid, result);
      }

      if (isPb) {
        result.isPb = true;
      }

      if (result.mode === "time" && String(result.mode2) === "60") {
        UserDAO.incrementBananas(uid, result.wpm);
        if (isPb && user.discordId) {
          BotDAO.updateDiscordRole(user.discordId, result.wpm);
        }
      }

      if (result.challenge && user.discordId) {
        BotDAO.awardChallenge(user.discordId, result.challenge);
      } else {
        delete result.challenge;
      }

      let tt = 0;
      let afk = result.afkDuration;
      if (afk == undefined) {
        afk = 0;
      }
      tt = result.testDuration + result.incompleteTestSeconds - afk;

      await UserDAO.updateTypingStats(uid, result.restartCount, tt);

      await PublicStatsDAO.updateStats(result.restartCount, tt);

      if (result.bailedOut === false) delete result.bailedOut;
      if (result.blindMode === false) delete result.blindMode;
      if (result.lazyMode === false) delete result.lazyMode;
      if (result.difficulty === "normal") delete result.difficulty;
      if (result.funbox === "none") delete result.funbox;
      if (result.language === "english") delete result.language;
      if (result.numbers === false) delete result.numbers;
      if (result.punctuation === false) delete result.punctuation;

      if (result.mode !== "custom") delete result.customText;

      let addedResult = await ResultDAO.addResult(uid, result);

      if (isPb) {
        Logger.log(
          "user_new_pb",
          `${result.mode + " " + result.mode2} ${result.wpm} ${result.acc}% ${
            result.rawWpm
          } ${result.consistency}% (${addedResult.insertedId})`,
          uid
        );
      }

      return res.status(200).json({
        message: "Result saved",
        isPb,
        name: result.name,
        tagPbs,
        insertedId: addedResult.insertedId,
      });
    } catch (e) {
      next(e);
    }
  }

  static async getLeaderboard(req, res, next) {
    try {
      // const { type, mode, mode2 } = req.params;
      // const results = await ResultDAO.getLeaderboard(type, mode, mode2);
      // return res.status(200).json(results);
      return res
        .status(503)
        .json({ message: "Leaderboard temporarily disabled" });
    } catch (e) {
      next(e);
    }
  }

  static async checkLeaderboardQualification(req, res, next) {
    try {
      // const { uid } = req.decodedToken;
      // const { result } = req.body;
      // const data = await ResultDAO.checkLeaderboardQualification(uid, result);
      // return res.status(200).json(data);
      return res
        .status(503)
        .json({ message: "Leaderboard temporarily disabled" });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = ResultController;
