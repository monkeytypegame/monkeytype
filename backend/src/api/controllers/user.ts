import _ from "lodash";
import * as UserDAL from "../../dal/user";
import MonkeyError from "../../utils/error";
import Logger from "../../utils/logger";
import { MonkeyResponse } from "../../utils/monkey-response";
import * as DiscordUtils from "../../utils/discord";
import {
  MILLISECONDS_IN_DAY,
  buildAgentLog,
  isDevEnvironment,
  sanitizeString,
} from "../../utils/misc";
import GeorgeQueue from "../../queues/george-queue";
import admin, { FirebaseError } from "firebase-admin";
import { deleteAllApeKeys } from "../../dal/ape-keys";
import { deleteAllPresets } from "../../dal/preset";
import { deleteAll as deleteAllResults } from "../../dal/result";
import { deleteConfig } from "../../dal/config";
import { verify } from "../../utils/captcha";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import { purgeUserFromDailyLeaderboards } from "../../utils/daily-leaderboards";
import { randomBytes } from "crypto";
import * as RedisClient from "../../init/redis";
import { v4 as uuidv4 } from "uuid";
import { ObjectId } from "mongodb";
import * as ReportDAL from "../../dal/report";
import emailQueue from "../../queues/email-queue";
import FirebaseAdmin from "../../init/firebase-admin";
import {
  removeTokensFromCacheByUid,
  deleteUser as firebaseDeleteUser,
} from "../../utils/auth";

async function verifyCaptcha(captcha: string): Promise<void> {
  if (!(await verify(captcha))) {
    throw new MonkeyError(422, "Captcha check failed");
  }
}

export async function createNewUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { name, captcha } = req.body;
  const { email, uid } = req.ctx.decodedToken;

  try {
    await verifyCaptcha(captcha);
  } catch (e) {
    try {
      await firebaseDeleteUser(uid);
    } catch (e) {
      // user might be deleted on the frontend
    }
    throw e;
  }

  if (email.endsWith("@tidal.lol") || email.endsWith("@selfbot.cc")) {
    throw new MonkeyError(400, "Invalid domain");
  }

  const available = await UserDAL.isNameAvailable(name, uid);
  if (!available) {
    throw new MonkeyError(409, "Username unavailable");
  }

  await UserDAL.addUser(name, email, uid);
  void Logger.logToDb("user_created", `${name} ${email}`, uid);

  return new MonkeyResponse("User created");
}

export async function sendVerificationEmail(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { email, uid } = req.ctx.decodedToken;
  const isVerified = (
    await admin
      .auth()
      .getUser(uid)
      .catch((e) => {
        throw new MonkeyError(
          500, // this should never happen, but it does. it mightve been caused by auth token cache, will see if disabling cache fixes it
          "Auth user not found, even though the token got decoded",
          JSON.stringify({ uid, email, stack: e.stack }),
          uid
        );
      })
  ).emailVerified;
  if (isVerified) {
    throw new MonkeyError(400, "Email already verified");
  }

  const userInfo = await UserDAL.getUser(uid, "request verification email");

  if (userInfo.email !== email) {
    throw new MonkeyError(
      400,
      "Authenticated email does not match the email found in the database. This might happen if you recently changed your email. Please refresh and try again."
    );
  }

  let link = "";
  try {
    link = await FirebaseAdmin()
      .auth()
      .generateEmailVerificationLink(email, {
        url: isDevEnvironment()
          ? "http://localhost:3000"
          : "https://monkeytype.com",
      });
  } catch (e) {
    const firebaseError = e as FirebaseError;
    if (
      firebaseError.code === "auth/internal-error" &&
      firebaseError.message.includes("TOO_MANY_ATTEMPTS_TRY_LATER")
    ) {
      // for some reason this error is not handled with a custom auth/ code, so we have to do it manually
      throw new MonkeyError(429, "Too many requests. Please try again later");
    }
    if (firebaseError.code === "auth/user-not-found") {
      throw new MonkeyError(
        500,
        "Auth user not found when the user was found in the database. Contact support with this error message and your email",
        JSON.stringify({
          decodedTokenEmail: email,
          userInfoEmail: userInfo.email,
          stack: e.stack,
        }),
        userInfo.uid
      );
    }
    if (firebaseError.message.includes("Internal error encountered.")) {
      throw new MonkeyError(
        500,
        "Firebase failed to generate an email verification link. Please try again later."
      );
    }
  }

  await emailQueue.sendVerificationEmail(email, userInfo.name, link);

  return new MonkeyResponse("Email sent");
}

export async function sendForgotPasswordEmail(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { email } = req.body;

  try {
    const uid = (await FirebaseAdmin().auth().getUserByEmail(email)).uid;
    const userInfo = await UserDAL.getUser(
      uid,
      "request forgot password email"
    );

    const link = await FirebaseAdmin()
      .auth()
      .generatePasswordResetLink(email, {
        url: isDevEnvironment()
          ? "http://localhost:3000"
          : "https://monkeytype.com",
      });

    await emailQueue.sendForgotPasswordEmail(email, userInfo.name, link);
  } catch {
    return new MonkeyResponse(
      "Password reset request received. If the email is valid, you will receive an email shortly."
    );
  }
  return new MonkeyResponse(
    "Password reset request received. If the email is valid, you will receive an email shortly."
  );
}

export async function deleteUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getUser(uid, "delete user");

  //cleanup database
  await Promise.all([
    UserDAL.deleteUser(uid),
    deleteAllApeKeys(uid),
    deleteAllPresets(uid),
    deleteConfig(uid),
    deleteAllResults(uid),
    purgeUserFromDailyLeaderboards(
      uid,
      req.ctx.configuration.dailyLeaderboards
    ),
  ]);

  //delete user from
  await firebaseDeleteUser(uid);

  void Logger.logToDb(
    "user_deleted",
    `${userInfo.email} ${userInfo.name}`,
    uid
  );

  return new MonkeyResponse("User deleted");
}

export async function resetUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getUser(uid, "reset user");
  const promises = [
    UserDAL.resetUser(uid),
    deleteAllApeKeys(uid),
    deleteAllPresets(uid),
    deleteAllResults(uid),
    deleteConfig(uid),
    purgeUserFromDailyLeaderboards(
      uid,
      req.ctx.configuration.dailyLeaderboards
    ),
  ];

  if (userInfo.discordId !== undefined && userInfo.discordId !== "") {
    promises.push(GeorgeQueue.unlinkDiscord(userInfo.discordId, uid));
  }
  await Promise.all(promises);
  void Logger.logToDb("user_reset", `${userInfo.email} ${userInfo.name}`, uid);

  return new MonkeyResponse("User reset");
}

export async function updateName(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { name } = req.body;

  const user = await UserDAL.getUser(uid, "update name");

  if (
    !user?.needsToChangeName &&
    Date.now() - (user.lastNameChange ?? 0) < MILLISECONDS_IN_DAY * 30
  ) {
    throw new MonkeyError(409, "You can change your name once every 30 days");
  }

  await UserDAL.updateName(uid, name, user.name);
  void Logger.logToDb(
    "user_name_updated",
    `changed name from ${user.name} to ${name}`,
    uid
  );

  return new MonkeyResponse("User's name updated");
}

export async function clearPb(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  await UserDAL.clearPb(uid);
  await purgeUserFromDailyLeaderboards(
    uid,
    req.ctx.configuration.dailyLeaderboards
  );
  void Logger.logToDb("user_cleared_pbs", "", uid);

  return new MonkeyResponse("User's PB cleared");
}

export async function optOutOfLeaderboards(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  await UserDAL.optOutOfLeaderboards(uid);
  await purgeUserFromDailyLeaderboards(
    uid,
    req.ctx.configuration.dailyLeaderboards
  );
  void Logger.logToDb("user_opted_out_of_leaderboards", "", uid);

  return new MonkeyResponse("User opted out of leaderboards");
}

export async function checkName(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { name } = req.params;
  const { uid } = req.ctx.decodedToken;

  const available = await UserDAL.isNameAvailable(name as string, uid);
  if (!available) {
    throw new MonkeyError(409, "Username unavailable");
  }

  return new MonkeyResponse("Username available");
}

export async function updateEmail(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  let { newEmail } = req.body;

  newEmail = newEmail.toLowerCase();

  try {
    await UserDAL.updateEmail(uid, newEmail);
  } catch (e) {
    throw new MonkeyError(404, e.message, "update email", uid);
  }

  void Logger.logToDb(
    "user_email_updated",
    `changed email to ${newEmail}`,
    uid
  );

  return new MonkeyResponse("Email updated");
}

function getRelevantUserInfo(
  user: MonkeyTypes.DBUser
): Partial<MonkeyTypes.DBUser> {
  return _.omit(user, [
    "bananas",
    "lbPersonalBests",
    "inbox",
    "nameHistory",
    "lastNameChange",
    "_id",
    "lastResultHashes",
    "note",
    "ips",
    "testsByYearAndDay",
  ]);
}

export async function getUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  let userInfo: MonkeyTypes.DBUser;
  try {
    userInfo = await UserDAL.getUser(uid, "get user");
  } catch (e) {
    if (e.status === 404) {
      //if the user is in the auth system but not in the db, its possible that the user was created by bypassing captcha
      //since there is no data in the database anyway, we can just delete the user from the auth system
      //and ask them to sign up again
      try {
        await firebaseDeleteUser(uid);
        throw new MonkeyError(
          404,
          "User not found in the database, but found in the auth system. We have deleted the ghost user from the auth system. Please sign up again.",
          "get user",
          uid
        );
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          throw new MonkeyError(
            404,
            "User not found in the database or the auth system. Please sign up again.",
            "get user",
            uid
          );
        } else {
          throw e;
        }
      }
    } else {
      throw e;
    }
  }

  userInfo.personalBests ??= {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
  };

  const agentLog = buildAgentLog(req);
  void Logger.logToDb("user_data_requested", agentLog, uid);
  void UserDAL.logIpAddress(uid, agentLog.ip, userInfo);

  let inboxUnreadSize = 0;
  if (req.ctx.configuration.users.inbox.enabled) {
    inboxUnreadSize = _.filter(userInfo.inbox, { read: false }).length;
  }

  if (!userInfo.name) {
    userInfo.needsToChangeName = true;
    await UserDAL.flagForNameChange(uid);
  }

  const isPremium = await UserDAL.checkIfUserIsPremium(uid, userInfo);

  const allTimeLbs = await getAllTimeLbs(uid);
  const testActivity = userInfo.testsByYearAndDay?.[new Date().getFullYear()];

  const userData = {
    ...getRelevantUserInfo(userInfo),
    inboxUnreadSize: inboxUnreadSize,
    isPremium,
    allTimeLbs,
    testActivity,
  };

  return new MonkeyResponse("User data retrieved", userData);
}

export async function getOauthLink(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new MonkeyError(500, "Redis connection not found");
  }

  const { uid } = req.ctx.decodedToken;
  const token = randomBytes(10).toString("hex");

  //add the token uid pair to reids
  await connection.setex(`discordoauth:${uid}`, 60, token);

  //build the url
  const url = DiscordUtils.getOauthLink();

  //return
  return new MonkeyResponse("Discord oauth link generated", {
    url: `${url}&state=${token}`,
  });
}

export async function linkDiscord(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new MonkeyError(500, "Redis connection not found");
  }
  const { uid } = req.ctx.decodedToken;
  const { tokenType, accessToken, state } = req.body;

  const redisToken = await connection.getdel(`discordoauth:${uid}`);

  if (!(redisToken ?? "") || redisToken !== state) {
    throw new MonkeyError(403, "Invalid user token");
  }

  const userInfo = await UserDAL.getUser(uid, "link discord");
  if (userInfo.banned) {
    throw new MonkeyError(403, "Banned accounts cannot link with Discord");
  }

  const { id: discordId, avatar: discordAvatar } =
    await DiscordUtils.getDiscordUser(tokenType, accessToken);

  if (userInfo.discordId !== undefined && userInfo.discordId !== "") {
    await UserDAL.linkDiscord(uid, userInfo.discordId, discordAvatar);
    return new MonkeyResponse("Discord avatar updated", {
      discordId,
      discordAvatar,
    });
  }

  if (!discordId) {
    throw new MonkeyError(
      500,
      "Could not get Discord account info",
      "discord id is undefined"
    );
  }

  const discordIdAvailable = await UserDAL.isDiscordIdAvailable(discordId);
  if (!discordIdAvailable) {
    throw new MonkeyError(
      409,
      "This Discord account is linked to a different account"
    );
  }

  await UserDAL.linkDiscord(uid, discordId, discordAvatar);

  await GeorgeQueue.linkDiscord(discordId, uid);
  void Logger.logToDb("user_discord_link", `linked to ${discordId}`, uid);

  return new MonkeyResponse("Discord account linked", {
    discordId,
    discordAvatar,
  });
}

export async function unlinkDiscord(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getUser(uid, "unlink discord");
  const discordId = userInfo.discordId;
  if (discordId === undefined || discordId === "") {
    throw new MonkeyError(404, "User does not have a linked Discord account");
  }

  await GeorgeQueue.unlinkDiscord(discordId, uid);
  await UserDAL.unlinkDiscord(uid);
  void Logger.logToDb("user_discord_unlinked", discordId, uid);

  return new MonkeyResponse("Discord account unlinked");
}

export async function addResultFilterPreset(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const filter = req.body;
  const { maxPresetsPerUser } = req.ctx.configuration.results.filterPresets;

  const createdId = await UserDAL.addResultFilterPreset(
    uid,
    filter,
    maxPresetsPerUser
  );
  return new MonkeyResponse("Result filter preset created", createdId);
}

export async function removeResultFilterPreset(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { presetId } = req.params;

  await UserDAL.removeResultFilterPreset(uid, presetId as string);
  return new MonkeyResponse("Result filter preset deleted");
}

export async function addTag(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagName } = req.body;

  const tag = await UserDAL.addTag(uid, tagName);
  return new MonkeyResponse("Tag updated", tag);
}

export async function clearTagPb(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId } = req.params;

  await UserDAL.removeTagPb(uid, tagId as string);
  return new MonkeyResponse("Tag PB cleared");
}

export async function editTag(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId, newName } = req.body;

  await UserDAL.editTag(uid, tagId, newName);
  return new MonkeyResponse("Tag updated");
}

export async function removeTag(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId } = req.params;

  await UserDAL.removeTag(uid, tagId as string);
  return new MonkeyResponse("Tag deleted");
}

export async function getTags(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const tags = await UserDAL.getTags(uid);
  return new MonkeyResponse("Tags retrieved", tags ?? []);
}

export async function updateLbMemory(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mode, language, rank } = req.body;
  const mode2 = req.body
    .mode2 as SharedTypes.Config.Mode2<SharedTypes.Config.Mode>;

  await UserDAL.updateLbMemory(uid, mode, mode2, language, rank);
  return new MonkeyResponse("Leaderboard memory updated");
}

export async function getCustomThemes(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const customThemes = await UserDAL.getThemes(uid);
  return new MonkeyResponse("Custom themes retrieved", customThemes);
}

export async function addCustomTheme(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { name, colors } = req.body;

  const addedTheme = await UserDAL.addTheme(uid, { name, colors });
  return new MonkeyResponse("Custom theme added", {
    theme: addedTheme,
  });
}

export async function removeCustomTheme(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { themeId } = req.body;
  await UserDAL.removeTheme(uid, themeId);
  return new MonkeyResponse("Custom theme removed");
}

export async function editCustomTheme(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { themeId, theme } = req.body;

  await UserDAL.editTheme(uid, themeId, theme);
  return new MonkeyResponse("Custom theme updated");
}

export async function getPersonalBests(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mode, mode2 } = req.query;

  const data =
    (await UserDAL.getPersonalBests(
      uid,
      mode as string,
      mode2 as string | undefined
    )) ?? null;
  return new MonkeyResponse("Personal bests retrieved", data);
}

export async function getStats(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = (await UserDAL.getStats(uid)) ?? null;
  return new MonkeyResponse("Personal stats retrieved", data);
}

export async function getFavoriteQuotes(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const quotes = await UserDAL.getFavoriteQuotes(uid);

  return new MonkeyResponse("Favorite quotes retrieved", quotes);
}

export async function addFavoriteQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const { language, quoteId } = req.body;

  await UserDAL.addFavoriteQuote(
    uid,
    language,
    quoteId,
    req.ctx.configuration.quotes.maxFavorites
  );

  return new MonkeyResponse("Quote added to favorites");
}

export async function removeFavoriteQuote(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const { quoteId, language } = req.body;
  await UserDAL.removeFavoriteQuote(uid, language, quoteId);

  return new MonkeyResponse("Quote removed from favorites");
}

export async function getProfile(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uidOrName } = req.params;

  const { isUid } = req.query;

  const user =
    isUid !== undefined
      ? await UserDAL.getUser(uidOrName as string, "get user profile")
      : await UserDAL.getUserByName(uidOrName as string, "get user profile");

  const {
    name,
    banned,
    inventory,
    profileDetails,
    personalBests,
    completedTests,
    startedTests,
    timeTyping,
    addedAt,
    discordId,
    discordAvatar,
    xp,
    streak,
    lbOptOut,
  } = user;

  const validTimePbs = _.pick(personalBests?.time, "15", "30", "60", "120");
  const validWordsPbs = _.pick(personalBests?.words, "10", "25", "50", "100");

  const typingStats = {
    completedTests,
    startedTests,
    timeTyping,
  };

  const relevantPersonalBests = {
    time: validTimePbs,
    words: validWordsPbs,
  };

  const baseProfile = {
    name,
    banned,
    addedAt,
    typingStats,
    personalBests: relevantPersonalBests,
    discordId,
    discordAvatar,
    xp,
    streak: streak?.length ?? 0,
    maxStreak: streak?.maxLength ?? 0,
    lbOptOut,
    isPremium: await UserDAL.checkIfUserIsPremium(user.uid, user),
  };

  if (banned) {
    return new MonkeyResponse("Profile retrived: banned user", baseProfile);
  }

  const allTimeLbs = await getAllTimeLbs(user.uid);

  const profileData = {
    ...baseProfile,
    inventory,
    details: profileDetails,
    allTimeLbs,
    uid: user.uid,
  } as SharedTypes.UserProfile;

  return new MonkeyResponse("Profile retrieved", profileData);
}

export async function updateProfile(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { bio, keyboard, socialProfiles, selectedBadgeId } = req.body;

  const user = await UserDAL.getUser(uid, "update user profile");

  if (user.banned) {
    throw new MonkeyError(403, "Banned users cannot update their profile");
  }

  user.inventory?.badges.forEach((badge) => {
    if (badge.id === selectedBadgeId) {
      badge.selected = true;
    } else {
      delete badge.selected;
    }
  });

  const profileDetailsUpdates: Partial<SharedTypes.UserProfileDetails> = {
    bio: sanitizeString(bio),
    keyboard: sanitizeString(keyboard),
    socialProfiles: _.mapValues(
      socialProfiles,
      sanitizeString
    ) as SharedTypes.UserProfileDetails["socialProfiles"],
  };

  await UserDAL.updateProfile(uid, profileDetailsUpdates, user.inventory);

  return new MonkeyResponse("Profile updated");
}

export async function getInbox(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const inbox = await UserDAL.getInbox(uid);

  return new MonkeyResponse("Inbox retrieved", {
    inbox,
    maxMail: req.ctx.configuration.users.inbox.maxMail,
  });
}

export async function updateInbox(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mailIdsToMarkRead, mailIdsToDelete } = req.body;

  await UserDAL.updateInbox(uid, mailIdsToMarkRead, mailIdsToDelete);

  return new MonkeyResponse("Inbox updated");
}

export async function reportUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const {
    reporting: { maxReports, contentReportLimit },
  } = req.ctx.configuration.quotes;

  const { uid: uidToReport, reason, comment, captcha } = req.body;

  await verifyCaptcha(captcha);

  const newReport: MonkeyTypes.Report = {
    _id: new ObjectId(),
    id: uuidv4(),
    type: "user",
    timestamp: new Date().getTime(),
    uid,
    contentId: `${uidToReport}`,
    reason,
    comment,
  };

  await ReportDAL.createReport(newReport, maxReports, contentReportLimit);

  return new MonkeyResponse("User reported");
}

export async function setStreakHourOffset(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { hourOffset } = req.body;

  const user = await UserDAL.getUser(uid, "update user profile");

  if (
    user.streak?.hourOffset !== undefined &&
    user.streak?.hourOffset !== null
  ) {
    throw new MonkeyError(403, "Streak hour offset already set");
  }

  await UserDAL.setStreakHourOffset(uid, hourOffset);

  return new MonkeyResponse("Streak hour offset set");
}

export async function toggleBan(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.body;

  const user = await UserDAL.getUser(uid, "toggle ban");
  const discordId = user.discordId;
  const discordIdIsValid = discordId !== undefined && discordId !== "";

  if (user.banned) {
    await UserDAL.setBanned(uid, false);
    if (discordIdIsValid) await GeorgeQueue.userBanned(discordId, false);
  } else {
    await UserDAL.setBanned(uid, true);
    if (discordIdIsValid) await GeorgeQueue.userBanned(discordId, true);
  }

  return new MonkeyResponse(`Ban toggled`, {
    banned: !user.banned,
  });
}

export async function revokeAllTokens(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  await FirebaseAdmin().auth().revokeRefreshTokens(uid);
  removeTokensFromCacheByUid(uid);
  return new MonkeyResponse("All tokens revoked");
}

async function getAllTimeLbs(uid: string): Promise<SharedTypes.AllTimeLbs> {
  const allTime15English = await LeaderboardsDAL.getRank(
    "time",
    "15",
    "english",
    uid
  );

  const allTime60English = await LeaderboardsDAL.getRank(
    "time",
    "60",
    "english",
    uid
  );

  const english15 =
    allTime15English === false
      ? undefined
      : ({
          rank: allTime15English.rank,
          count: allTime15English.count,
        } as SharedTypes.RankAndCount);

  const english60 =
    allTime60English === false
      ? undefined
      : ({
          rank: allTime60English.rank,
          count: allTime60English.count,
        } as SharedTypes.RankAndCount);

  return {
    time: {
      "15": {
        english: english15,
      },
      "60": {
        english: english60,
      },
    },
  };
}
