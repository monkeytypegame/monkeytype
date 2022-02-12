const ResultDAO = require("../../dao/result");
const UserDAO = require("../../dao/user");
const PublicStatsDAO = require("../../dao/public-stats");
const BotDAO = require("../../dao/bot");
const { validateObjectValues } = require("../../handlers/validation");
const { stdDev, roundTo2 } = require("../../handlers/misc");
const objecthash = require("node-object-hash")().hash;
const Logger = require("../../handlers/logger");
const path = require("path");
const { config } = require("dotenv");
config({ path: path.join(__dirname, ".env") });

let validateResult;
let validateKeys;
try {
  // eslint-disable-next-line
  let module = require("../../anticheat/anticheat");
  validateResult = module.validateResult;
  validateKeys = module.validateKeys;
  if (!validateResult || !validateKeys) throw new Error("undefined");
} catch (e) {
  if (process.env.MODE === "dev") {
    console.error(
      "No anticheat module found. Continuing in dev mode, results will not be validated."
    );
  } else {
    console.error("No anticheat module found.");
    console.error(
      "To continue in dev mode, add 'MODE=dev' to the .env file in the backend directory."
    );
    process.exit(1);
  }
}

class ResultController {
  static async getResults(req, _res) {
    const { uid } = req.ctx.decodedToken;

    return await ResultDAO.getResults(uid);
  }

  static async deleteAll(req, res) {
    const { uid } = req.ctx.decodedToken;

    await ResultDAO.deleteAll(uid);
    Logger.log("user_results_deleted", "", uid);

    return res.sendStatus(200);
  }

  static async updateTags(req, res) {
    const { uid } = req.ctx.decodedToken;
    const { tags, resultid } = req.body;

    await ResultDAO.updateTags(uid, resultid, tags);

    return res.sendStatus(200);
  }

  static async addResult(req, res) {
    const { uid } = req.ctx.decodedToken;
    const { result } = req.body;
    result.uid = uid;
    if (validateObjectValues(result) > 0)
      return res.status(400).json({ message: "Bad input" });
    if (result.wpm === result.raw && result.acc !== 100) {
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

    let resulthash = result.hash;
    delete result.hash;
    if (
      req.ctx.configuration.resultObjectHashCheck.enabled &&
      resulthash.length === 64
    ) {
      //if its not 64 that means client is still using old hashing package
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
    }

    if (validateResult) {
      if (!validateResult(result)) {
        return res
          .status(400)
          .json({ message: "Result data doesn't make sense" });
      }
    } else {
      if (process.env.MODE === "dev") {
        console.error(
          "No anticheat module found. Continuing in dev mode, results will not be validated."
        );
      } else {
        throw new Error("No anticheat module found");
      }
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
          if (validateKeys) {
            if (!validateKeys(result, uid)) {
              return res.status(400).json({ message: "Possible bot detected" });
            }
          } else {
            if (process.env.MODE === "dev") {
              console.error(
                "No anticheat module found. Continuing in dev mode, results will not be validated."
              );
            } else {
              throw new Error("No anticheat module found");
            }
          }
        } else {
          return res.status(400).json({ message: "Missing key data" });
        }
      }
    }

    delete result.keySpacing;
    delete result.keyDuration;
    delete result.smoothConsistency;
    delete result.wpmConsistency;

    try {
      result.keyDurationStats.average = roundTo2(
        result.keyDurationStats.average
      );
      result.keyDurationStats.sd = roundTo2(result.keyDurationStats.sd);
      result.keySpacingStats.average = roundTo2(result.keySpacingStats.average);
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
  }
}

module.exports = ResultController;
