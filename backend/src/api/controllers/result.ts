import * as ResultDAL from "../../dal/result";
import {
  getUser,
  checkIfPb,
  checkIfTagPb,
  incrementBananas,
  updateTypingStats,
  recordAutoBanEvent,
} from "../../dal/user";
import * as PublicDAL from "../../dal/public";
import {
  getCurrentDayTimestamp,
  getStartOfDayTimestamp,
  isDevEnvironment,
  mapRange,
  roundTo2,
  stdDev,
  stringToNumberOrDefault,
} from "../../utils/misc";
import objectHash from "object-hash";
import Logger from "../../utils/logger";
import "dotenv/config";
import { MonkeyResponse } from "../../utils/monkey-response";
import MonkeyError from "../../utils/error";
import { areFunboxesCompatible, isTestTooShort } from "../../utils/validation";
import {
  implemented as anticheatImplemented,
  validateResult,
  validateKeys,
} from "../../anticheat/index";
import MonkeyStatusCodes from "../../constants/monkey-status-codes";
import {
  incrementResult,
  incrementDailyLeaderboard,
} from "../../utils/prometheus";
import GeorgeQueue from "../../queues/george-queue";
import { getDailyLeaderboard } from "../../utils/daily-leaderboards";
import AutoRoleList from "../../constants/auto-roles";
import * as UserDAL from "../../dal/user";
import { buildMonkeyMail } from "../../utils/monkey-mail";
import FunboxList from "../../constants/funbox-list";
import _ from "lodash";
import * as WeeklyXpLeaderboard from "../../services/weekly-xp-leaderboard";
import { UAParser } from "ua-parser-js";
import { canFunboxGetPb } from "../../utils/pb";

try {
  if (anticheatImplemented() === false) throw new Error("undefined");
  Logger.success("Anticheat module loaded");
} catch (e) {
  if (isDevEnvironment()) {
    Logger.warning(
      "No anticheat module found. Continuing in dev mode, results will not be validated."
    );
  } else {
    Logger.error(
      "No anticheat module found. To continue in dev mode, add MODE=dev to your .env file in the backend directory"
    );
    process.exit(1);
  }
}

export async function getResults(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const premiumFeaturesEnabled = req.ctx.configuration.users.premium.enabled;
  const userHasPremium = await UserDAL.checkIfUserIsPremium(uid);

  const maxLimit =
    premiumFeaturesEnabled && userHasPremium
      ? req.ctx.configuration.results.limits.premiumUser
      : req.ctx.configuration.results.limits.regularUser;

  const onOrAfterTimestamp = parseInt(
    req.query.onOrAfterTimestamp as string,
    10
  );
  let limit = stringToNumberOrDefault(
    req.query.limit as string,
    Math.min(req.ctx.configuration.results.maxBatchSize, maxLimit)
  );
  const offset = stringToNumberOrDefault(req.query.offset as string, 0);

  //check if premium features are disabled and current call exceeds the limit for regular users
  if (
    userHasPremium &&
    premiumFeaturesEnabled === false &&
    limit + offset > req.ctx.configuration.results.limits.regularUser
  ) {
    throw new MonkeyError(503, "Premium feature disabled.");
  }

  if (limit + offset > maxLimit) {
    if (offset < maxLimit) {
      //batch is partly in the allowed ranged. Set the limit to the max allowed and return partly results.
      limit = maxLimit - offset;
    } else {
      throw new MonkeyError(422, `Max results limit of ${maxLimit} exceeded.`);
    }
  }

  const results = await ResultDAL.getResults(uid, {
    onOrAfterTimestamp,
    limit,
    offset,
  });
  Logger.logToDb(
    "user_results_requested",
    {
      limit,
      offset,
      onOrAfterTimestamp,
      isPremium: userHasPremium,
    },
    uid
  );
  return new MonkeyResponse("Results retrieved", results);
}

export async function getLastResult(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const results = await ResultDAL.getLastResult(uid);
  return new MonkeyResponse("Result retrieved", results);
}

export async function deleteAll(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  await ResultDAL.deleteAll(uid);
  Logger.logToDb("user_results_deleted", "", uid);
  return new MonkeyResponse("All results deleted");
}

export async function updateTags(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagIds, resultId } = req.body;

  await ResultDAL.updateTags(uid, resultId, tagIds);
  const result = await ResultDAL.getResult(uid, resultId);

  if (!result.difficulty) {
    result.difficulty = "normal";
  }
  if (!result.language) {
    result.language = "english";
  }
  if (!result.funbox) {
    result.funbox = "none";
  }
  if (!result.lazyMode) {
    result.lazyMode = false;
  }
  if (!result.punctuation) {
    result.punctuation = false;
  }

  const user = await getUser(uid, "update tags");
  const tagPbs = await checkIfTagPb(uid, user, result);
  return new MonkeyResponse("Result tags updated", {
    tagPbs,
  });
}

interface AddResultData {
  isPb: boolean;
  tagPbs: string[];
  insertedId: ObjectId;
  dailyLeaderboardRank?: number;
  weeklyXpLeaderboardRank?: number;
  xp: number;
  dailyXpBonus: boolean;
  xpBreakdown: Record<string, number>;
  streak: number;
}

export async function addResult(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const user = await getUser(uid, "add result");

  if (user.needsToChangeName) {
    throw new MonkeyError(
      403,
      "Please change your name before submitting a result"
    );
  }

  //todo add a type here
  const result = Object.assign({}, req.body.result);
  if (!user.lbOptOut && result.acc < 75) {
    throw new MonkeyError(
      400,
      "Cannot submit a result with less than 75% accuracy"
    );
  }
  result.uid = uid;
  if (isTestTooShort(result)) {
    const status = MonkeyStatusCodes.TEST_TOO_SHORT;
    throw new MonkeyError(status.code, status.message);
  }

  const resulthash = result.hash;
  delete result.hash;
  delete result.stringified;
  if (req.ctx.configuration.results.objectHashCheckEnabled) {
    const serverhash = objectHash(result);
    if (serverhash !== resulthash) {
      Logger.logToDb(
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

  if (result.funbox) {
    const funboxes = result.funbox.split("#");
    if (funboxes.length !== _.uniq(funboxes).length) {
      throw new MonkeyError(400, "Duplicate funboxes");
    }
  }

  if (!areFunboxesCompatible(result.funbox)) {
    throw new MonkeyError(400, "Impossible funbox combination");
  }

  try {
    result.keySpacingStats = {
      average:
        result.keySpacing.reduce((previous, current) => (current += previous)) /
        result.keySpacing.length,
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

  if (anticheatImplemented()) {
    if (
      !validateResult(
        result,
        (req.headers["x-client-version"] ||
          req.headers["client-version"]) as string,
        JSON.stringify(new UAParser(req.headers["user-agent"]).getResult()),
        user.lbOptOut === true
      )
    ) {
      const status = MonkeyStatusCodes.RESULT_DATA_INVALID;
      throw new MonkeyError(status.code, "Result data doesn't make sense");
    }
  } else {
    if (!isDevEnvironment()) {
      throw new Error("No anticheat module found");
    }
    Logger.warning(
      "No anticheat module found. Continuing in dev mode, results will not be validated."
    );
  }

  //dont use - result timestamp is unreliable, can be changed by system time and stuff
  // if (result.timestamp > Math.round(Date.now() / 1000) * 1000 + 10) {
  //   log(
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
    lastResultTimestamp = (await ResultDAL.getLastResult(uid)).timestamp;
  } catch (e) {
    lastResultTimestamp = null;
  }

  result.timestamp = Math.floor(Date.now() / 1000) * 1000;

  //check if now is earlier than last result plus duration (-1 second as a buffer)
  const earliestPossible = lastResultTimestamp + testDurationMilis;
  const nowNoMilis = Math.floor(Date.now() / 1000) * 1000;
  if (lastResultTimestamp && nowNoMilis < earliestPossible - 1000) {
    Logger.logToDb(
      "invalid_result_spacing",
      {
        lastTimestamp: lastResultTimestamp,
        earliestPossible,
        now: nowNoMilis,
        testDuration: testDurationMilis,
        difference: nowNoMilis - earliestPossible,
      },
      uid
    );
    const status = MonkeyStatusCodes.RESULT_SPACING_INVALID;
    throw new MonkeyError(status.code, "Invalid result spacing");
  }

  //check keyspacing and duration here for bots
  if (
    result.mode === "time" &&
    result.wpm > 130 &&
    result.testDuration < 122 &&
    (user.verified === false || user.verified === undefined) &&
    user.lbOptOut !== true &&
    user.banned !== true //no need to check again if user is already banned
  ) {
    if (!result.keySpacingStats || !result.keyDurationStats) {
      const status = MonkeyStatusCodes.MISSING_KEY_DATA;
      throw new MonkeyError(status.code, "Missing key data");
    }
    if (result.keyOverlap === undefined) {
      throw new MonkeyError(400, "Old key data format");
    }
    if (anticheatImplemented()) {
      if (!validateKeys(result, uid)) {
        //autoban
        const autoBanConfig = req.ctx.configuration.users.autoBan;
        if (autoBanConfig.enabled) {
          const didUserGetBanned = await recordAutoBanEvent(
            uid,
            autoBanConfig.maxCount,
            autoBanConfig.maxHours
          );
          if (didUserGetBanned) {
            const mail = buildMonkeyMail({
              subject: "Banned",
              body: "Your account has been automatically banned for triggering the anticheat system. If you believe this is a mistake, please contact support.",
            });
            UserDAL.addToInbox(uid, [mail], req.ctx.configuration.users.inbox);
            user.banned = true;
          }
        }
        const status = MonkeyStatusCodes.BOT_DETECTED;
        throw new MonkeyError(status.code, "Possible bot detected");
      }
    } else {
      if (!isDevEnvironment()) {
        throw new Error("No anticheat module found");
      }
      Logger.warning(
        "No anticheat module found. Continuing in dev mode, results will not be validated."
      );
    }
  }

  delete result.keySpacing;
  delete result.keyDuration;
  delete result.smoothConsistency;
  delete result.wpmConsistency;
  delete result.keyOverlap;
  delete result.lastKeyToEnd;
  delete result.startToFirstKey;
  delete result.charTotal;

  if (req.ctx.configuration.users.lastHashesCheck.enabled) {
    let lastHashes = user.lastReultHashes ?? [];
    if (lastHashes.includes(resulthash)) {
      Logger.logToDb(
        "duplicate_result",
        {
          lastHashes,
          resulthash,
          result,
        },
        uid
      );
      const status = MonkeyStatusCodes.DUPLICATE_RESULT;
      throw new MonkeyError(status.code, "Duplicate result");
    } else {
      lastHashes.unshift(resulthash);
      const maxHashes = req.ctx.configuration.users.lastHashesCheck.maxHashes;
      if (lastHashes.length > maxHashes) {
        lastHashes = lastHashes.slice(0, maxHashes);
      }
      await UserDAL.updateLastHashes(uid, lastHashes);
    }
  }

  result.name = user.name;

  try {
    result.keyDurationStats.average = roundTo2(result.keyDurationStats.average);
    result.keyDurationStats.sd = roundTo2(result.keyDurationStats.sd);
    result.keySpacingStats.average = roundTo2(result.keySpacingStats.average);
    result.keySpacingStats.sd = roundTo2(result.keySpacingStats.sd);
  } catch (e) {
    //
  }

  let isPb = false;
  let tagPbs: string[] = [];

  if (!result.bailedOut) {
    [isPb, tagPbs] = await Promise.all([
      checkIfPb(uid, user, result),
      checkIfTagPb(uid, user, result),
    ]);
  }

  if (isPb) {
    result.isPb = true;
  }

  if (result.mode === "time" && result.mode2 === "60") {
    incrementBananas(uid, result.wpm);
    if (isPb && user.discordId) {
      GeorgeQueue.updateDiscordRole(user.discordId, result.wpm);
    }
  }

  if (
    result.challenge &&
    AutoRoleList.includes(result.challenge) &&
    user.discordId
  ) {
    GeorgeQueue.awardChallenge(user.discordId, result.challenge);
  } else {
    delete result.challenge;
  }

  const afk = result.afkDuration ?? 0;
  const totalDurationTypedSeconds =
    result.testDuration + result.incompleteTestSeconds - afk;
  updateTypingStats(uid, result.restartCount, totalDurationTypedSeconds);
  PublicDAL.updateStats(result.restartCount, totalDurationTypedSeconds);

  const dailyLeaderboardsConfig = req.ctx.configuration.dailyLeaderboards;
  const dailyLeaderboard = getDailyLeaderboard(
    result.language,
    result.mode,
    result.mode2,
    dailyLeaderboardsConfig
  );

  let dailyLeaderboardRank = -1;

  const validResultCriteria =
    canFunboxGetPb(result) &&
    !result.bailedOut &&
    user.banned !== true &&
    user.lbOptOut !== true &&
    (isDevEnvironment() || (user.timeTyping ?? 0) > 7200);

  const selectedBadgeId = user.inventory?.badges?.find((b) => b.selected)?.id;

  if (dailyLeaderboard && validResultCriteria) {
    incrementDailyLeaderboard(result.mode, result.mode2, result.language);
    dailyLeaderboardRank = await dailyLeaderboard.addResult(
      {
        name: user.name,
        wpm: result.wpm,
        raw: result.rawWpm,
        acc: result.acc,
        consistency: result.consistency,
        timestamp: result.timestamp,
        uid,
        discordAvatar: user.discordAvatar,
        discordId: user.discordId,
        badgeId: selectedBadgeId,
      },
      dailyLeaderboardsConfig
    );
  }

  const streak = await UserDAL.updateStreak(uid, result.timestamp);

  const shouldGetBadge =
    streak >= 365 &&
    user.inventory?.badges?.find((b) => b.id === 14) === undefined &&
    (
      user.inbox
        ?.map((i) =>
          (i.rewards ?? []).map((r) => (r.type === "badge" ? r.item.id : null))
        )
        .flat() ?? []
    ).includes(14) === false;

  if (shouldGetBadge) {
    const mail = buildMonkeyMail({
      subject: "Badge",
      body: "Congratulations for reaching a 365 day streak! You have been awarded a special badge. Now, go touch some grass.",
      rewards: [
        {
          type: "badge",
          item: {
            id: 14,
          },
        },
      ],
    });
    UserDAL.addToInbox(uid, [mail], req.ctx.configuration.users.inbox);
  }

  const xpGained = await calculateXp(
    result,
    req.ctx.configuration.users.xp,
    uid,
    user.xp ?? 0,
    streak
  );

  if (xpGained.xp < 0) {
    throw new MonkeyError(
      500,
      "Calculated XP is negative",
      JSON.stringify({
        xpGained,
        result,
      }),
      uid
    );
  }

  const weeklyXpLeaderboardConfig = req.ctx.configuration.leaderboards.weeklyXp;
  let weeklyXpLeaderboardRank = -1;
  const eligibleForWeeklyXpLeaderboard =
    user.banned !== true &&
    user.lbOptOut !== true &&
    (isDevEnvironment() || (user.timeTyping ?? 0) > 7200);

  const weeklyXpLeaderboard = WeeklyXpLeaderboard.get(
    weeklyXpLeaderboardConfig
  );
  if (
    eligibleForWeeklyXpLeaderboard &&
    xpGained.xp > 0 &&
    weeklyXpLeaderboard
  ) {
    weeklyXpLeaderboardRank = await weeklyXpLeaderboard.addResult(
      weeklyXpLeaderboardConfig,
      {
        entry: {
          uid,
          name: user.name,
          discordAvatar: user.discordAvatar,
          discordId: user.discordId,
          badgeId: selectedBadgeId,
          lastActivityTimestamp: Date.now(),
        },
        xpGained: xpGained.xp,
        timeTypedSeconds: totalDurationTypedSeconds,
      }
    );
  }

  if (result.bailedOut === false) delete result.bailedOut;
  if (result.blindMode === false) delete result.blindMode;
  if (result.lazyMode === false) delete result.lazyMode;
  if (result.difficulty === "normal") delete result.difficulty;
  if (result.funbox === "none") delete result.funbox;
  if (result.language === "english") delete result.language;
  if (result.numbers === false) delete result.numbers;
  if (result.punctuation === false) delete result.punctuation;
  if (result.mode !== "custom") delete result.customText;
  if (result.restartCount === 0) delete result.restartCount;
  if (result.incompleteTestSeconds === 0) delete result.incompleteTestSeconds;
  if (result.afkDuration === 0) delete result.afkDuration;
  if (result.tags.length === 0) delete result.tags;

  delete result.incompleteTests;

  const addedResult = await ResultDAL.addResult(uid, result);

  await UserDAL.incrementXp(uid, xpGained.xp);

  if (isPb) {
    Logger.logToDb(
      "user_new_pb",
      `${result.mode + " " + result.mode2} ${result.wpm} ${result.acc}% ${
        result.rawWpm
      } ${result.consistency}% (${addedResult.insertedId})`,
      uid
    );
  }

  const data: AddResultData = {
    isPb,
    tagPbs,
    insertedId: addedResult.insertedId,
    xp: xpGained.xp,
    dailyXpBonus: xpGained.dailyBonus ?? false,
    xpBreakdown: xpGained.breakdown ?? {},
    streak,
  };

  if (dailyLeaderboardRank !== -1) {
    data.dailyLeaderboardRank = dailyLeaderboardRank;
  }

  if (weeklyXpLeaderboardRank !== -1) {
    data.weeklyXpLeaderboardRank = weeklyXpLeaderboardRank;
  }

  incrementResult(result);

  return new MonkeyResponse("Result saved", data);
}

interface XpResult {
  xp: number;
  dailyBonus?: boolean;
  breakdown?: Record<string, number>;
}

async function calculateXp(
  result,
  xpConfiguration: MonkeyTypes.Configuration["users"]["xp"],
  uid: string,
  currentTotalXp: number,
  streak: number
): Promise<XpResult> {
  const {
    mode,
    acc,
    testDuration,
    incompleteTestSeconds,
    incompleteTests,
    afkDuration,
    charStats,
    punctuation,
    numbers,
    funbox,
  } = result;

  const {
    enabled,
    gainMultiplier,
    maxDailyBonus,
    minDailyBonus,
    funboxBonus: funboxBonusConfiguration,
  } = xpConfiguration;

  if (mode === "zen" || !enabled) {
    return {
      xp: 0,
    };
  }

  const breakdown: Record<string, number> = {};

  const baseXp = Math.round((testDuration - afkDuration) * 2);
  breakdown["base"] = baseXp;

  let modifier = 1;

  const correctedEverything = charStats
    .slice(1)
    .every((charStat: number) => charStat === 0);

  if (acc === 100) {
    modifier += 0.5;
    breakdown["100%"] = Math.round(baseXp * 0.5);
  } else if (correctedEverything) {
    // corrected everything bonus
    modifier += 0.25;
    breakdown["corrected"] = Math.round(baseXp * 0.25);
  }

  if (mode === "quote") {
    // real sentences bonus
    modifier += 0.5;
    breakdown["quote"] = Math.round(baseXp * 0.5);
  } else {
    // punctuation bonus
    if (punctuation) {
      modifier += 0.4;
      breakdown["punctuation"] = Math.round(baseXp * 0.4);
    }
    if (numbers) {
      modifier += 0.1;
      breakdown["numbers"] = Math.round(baseXp * 0.1);
    }
  }

  if (funboxBonusConfiguration > 0) {
    const funboxModifier = _.sumBy(funbox.split("#"), (funboxName) => {
      const funbox = FunboxList.find((f) => f.name === funboxName);
      const difficultyLevel = funbox?.difficultyLevel ?? 0;
      return Math.max(difficultyLevel * funboxBonusConfiguration, 0);
    });
    if (funboxModifier > 0) {
      modifier += funboxModifier;
      breakdown["funbox"] = Math.round(baseXp * funboxModifier);
    }
  }

  if (xpConfiguration.streak.enabled) {
    const streakModifier = parseFloat(
      mapRange(
        streak,
        0,
        xpConfiguration.streak.maxStreakDays,
        0,
        xpConfiguration.streak.maxStreakMultiplier,
        true
      ).toFixed(1)
    );

    if (streakModifier > 0) {
      modifier += streakModifier;
      breakdown["streak"] = Math.round(baseXp * streakModifier);
    }
  }

  let incompleteXp = 0;
  if (incompleteTests && incompleteTests.length > 0) {
    incompleteTests.forEach((it: { acc: number; seconds: number }) => {
      let modifier = (it.acc - 50) / 50;
      if (modifier < 0) modifier = 0;
      incompleteXp += Math.round(it.seconds * modifier);
    });
    breakdown["incomplete"] = incompleteXp;
  } else if (incompleteTestSeconds && incompleteTestSeconds > 0) {
    incompleteXp = Math.round(incompleteTestSeconds);
    breakdown["incomplete"] = incompleteXp;
  }

  const accuracyModifier = (acc - 50) / 50;

  let dailyBonus = 0;
  let lastResultTimestamp: number | undefined;

  try {
    const { timestamp } = await ResultDAL.getLastResult(uid);
    lastResultTimestamp = timestamp;
  } catch (err) {
    Logger.error(`Could not fetch last result: ${err}`);
  }

  if (lastResultTimestamp) {
    const lastResultDay = getStartOfDayTimestamp(lastResultTimestamp);
    const today = getCurrentDayTimestamp();
    if (lastResultDay !== today) {
      const proportionalXp = Math.round(currentTotalXp * 0.05);
      dailyBonus = Math.max(
        Math.min(maxDailyBonus, proportionalXp),
        minDailyBonus
      );
      breakdown["daily"] = dailyBonus;
    }
  }

  const xpWithModifiers = Math.round(baseXp * modifier);

  const xpAfterAccuracy = Math.round(xpWithModifiers * accuracyModifier);
  breakdown["accPenalty"] = xpWithModifiers - xpAfterAccuracy;

  const totalXp =
    Math.round((xpAfterAccuracy + incompleteXp) * gainMultiplier) + dailyBonus;

  if (gainMultiplier > 1) {
    // breakdown.push([
    //   "configMultiplier",
    //   Math.round((xpAfterAccuracy + incompleteXp) * (gainMultiplier - 1)),
    // ]);
    breakdown["configMultiplier"] = gainMultiplier;
  }

  const isAwardingDailyBonus = dailyBonus > 0;

  return {
    xp: totalXp,
    dailyBonus: isAwardingDailyBonus,
    breakdown,
  };
}
