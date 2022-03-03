import ResultDAO from "../../dao/result";
import UserDAO from "../../dao/user";
import PublicStatsDAO from "../../dao/public-stats";
import BotDAO from "../../dao/bot";
import { roundTo2, stdDev } from "../../utils/misc";
import node_object_hash from "node-object-hash";
import Logger from "../../utils/logger";
import "dotenv/config";
import { MonkeyResponse } from "../../utils/monkey-response";
import MonkeyError from "../../utils/error";
import {
  implemented as anticheatImplemented,
  validateResult,
  validateKeys,
} from "../../anticheat/index";
import MonkeyStatusCodes from "../../constants/monkey-status-codes";

const objecthash = node_object_hash().hash;

try {
  if (anticheatImplemented() === false) throw new Error("undefined");
  console.log("Anticheat module loaded");
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
    const results = await ResultDAO.getResults(uid);
    return new MonkeyResponse("Result retrieved", results);
  }

  static async deleteAll(req, _res) {
    const { uid } = req.ctx.decodedToken;

    await ResultDAO.deleteAll(uid);
    Logger.log("user_results_deleted", "", uid);
    return new MonkeyResponse("All results deleted");
  }

  static async updateTags(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { tagIds, resultId } = req.body;

    await ResultDAO.updateTags(uid, resultId, tagIds);
    return new MonkeyResponse("Result tags updated");
  }

  static async addResult(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { result } = req.body;
    result.uid = uid;
    if (result.wpm === result.raw && result.acc !== 100) {
      const status = MonkeyStatusCodes.RESULT_DATA_INVALID;
      throw new MonkeyError(status.code, "Bad input"); // todo move this
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
      const status = MonkeyStatusCodes.TEST_TOO_SHORT;
      throw new MonkeyError(status.code, status.message);
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
        const status = MonkeyStatusCodes.RESULT_HASH_INVALID;
        throw new MonkeyError(status.code, "Incorrect result hash");
      }
    }

    if (anticheatImplemented()) {
      if (!validateResult(result)) {
        const status = MonkeyStatusCodes.RESULT_DATA_INVALID;
        throw new MonkeyError(status.code, "Result data doesn't make sense");
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
      const status = MonkeyStatusCodes.RESULT_SPACING_INVALID;
      throw new MonkeyError(status.code, "Invalid result spacing");
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
          if (anticheatImplemented()) {
            if (!validateKeys(result, uid)) {
              const status = MonkeyStatusCodes.BOT_DETECTED;
              throw new MonkeyError(status.code, "Possible bot detected");
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
          const status = MonkeyStatusCodes.MISSING_KEY_DATA;
          throw new MonkeyError(status.code, "Missing key data");
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

    const data = {
      isPb,
      name: result.name,
      tagPbs,
      insertedId: addedResult.insertedId,
    };

    return new MonkeyResponse("Result saved", data);
  }
}

export default ResultController;
