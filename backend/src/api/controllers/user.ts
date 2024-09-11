import _ from "lodash";
import * as UserDAL from "../../dal/user";
import MonkeyError from "../../utils/error";
import { MonkeyResponse2 } from "../../utils/monkey-response";
import * as DiscordUtils from "../../utils/discord";
import {
  MILLISECONDS_IN_DAY,
  buildAgentLog,
  isDevEnvironment,
  replaceObjectId,
  replaceObjectIds,
  sanitizeString,
} from "../../utils/misc";
import GeorgeQueue from "../../queues/george-queue";
import { type FirebaseError } from "firebase-admin";
import { deleteAllApeKeys } from "../../dal/ape-keys";
import { deleteAllPresets } from "../../dal/preset";
import { deleteAll as deleteAllResults } from "../../dal/result";
import { deleteConfig } from "../../dal/config";
import { verify } from "../../utils/captcha";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import { purgeUserFromDailyLeaderboards } from "../../utils/daily-leaderboards";
import { v4 as uuidv4 } from "uuid";
import { ObjectId } from "mongodb";
import * as ReportDAL from "../../dal/report";
import emailQueue from "../../queues/email-queue";
import FirebaseAdmin from "../../init/firebase-admin";
import * as AuthUtil from "../../utils/auth";
import * as Dates from "date-fns";
import { UTCDateMini } from "@date-fns/utc";
import * as BlocklistDal from "../../dal/blocklist";
import {
  AllTimeLbs,
  ResultFilters,
  User,
  UserProfile,
  CountByYearAndDay,
  TestActivity,
  UserProfileDetails,
} from "@monkeytype/contracts/schemas/users";
import { addImportantLog, addLog, deleteUserLogs } from "../../dal/logs";
import { sendForgotPasswordEmail as authSendForgotPasswordEmail } from "../../utils/auth";
import {
  AddCustomThemeRequest,
  AddCustomThemeResponse,
  AddFavoriteQuoteRequest,
  AddResultFilterPresetRequest,
  AddResultFilterPresetResponse,
  AddTagRequest,
  AddTagResponse,
  CheckNamePathParameters,
  CreateUserRequest,
  DeleteCustomThemeRequest,
  EditCustomThemeRequst,
  EditTagRequest,
  ForgotPasswordEmailRequest,
  GetCurrentTestActivityResponse,
  GetCustomThemesResponse,
  GetDiscordOauthLinkResponse,
  GetFavoriteQuotesResponse,
  GetPersonalBestsQuery,
  GetPersonalBestsResponse,
  GetProfilePathParams,
  GetProfileQuery,
  GetProfileResponse,
  GetStatsResponse,
  GetStreakResponseSchema,
  GetTagsResponse,
  GetTestActivityResponse,
  GetUserInboxResponse,
  GetUserResponse,
  LinkDiscordRequest,
  LinkDiscordResponse,
  RemoveFavoriteQuoteRequest,
  RemoveResultFilterPresetPathParams,
  ReportUserRequest,
  SetStreakHourOffsetRequest,
  TagIdPathParams,
  UpdateEmailRequestSchema,
  UpdateLeaderboardMemoryRequest,
  UpdatePasswordRequest,
  UpdateUserInboxRequest,
  UpdateUserNameRequest,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
} from "@monkeytype/contracts/users";

async function verifyCaptcha(captcha: string): Promise<void> {
  let verified = false;
  try {
    verified = await verify(captcha);
  } catch (e) {
    //fetch to recaptcha api can sometimes fail
    throw new MonkeyError(
      422,
      "Request to the Captcha API failed, please try again later"
    );
  }
  if (!verified) {
    throw new MonkeyError(422, "Captcha challenge failed");
  }
}

export async function createNewUser(
  req: MonkeyTypes.Request2<undefined, CreateUserRequest>
): Promise<MonkeyResponse2> {
  const { name, captcha } = req.body;
  const { email, uid } = req.ctx.decodedToken;

  try {
    await verifyCaptcha(captcha);

    if (email.endsWith("@tidal.lol") || email.endsWith("@selfbot.cc")) {
      throw new MonkeyError(400, "Invalid domain");
    }

    const available = await UserDAL.isNameAvailable(name, uid);
    if (!available) {
      throw new MonkeyError(409, "Username unavailable");
    }

    const blocklisted = await BlocklistDal.contains({ name, email });
    if (blocklisted) {
      throw new MonkeyError(409, "Username or email blocked");
    }

    await UserDAL.addUser(name, email, uid);
    void addImportantLog("user_created", `${name} ${email}`, uid);

    return new MonkeyResponse2("User created", null);
  } catch (e) {
    //user was created in firebase from the frontend, remove it
    await firebaseDeleteUserIgnoreError(uid);
    throw e;
  }
}

export async function sendVerificationEmail(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2> {
  const { email, uid } = req.ctx.decodedToken;
  const isVerified = (
    await FirebaseAdmin()
      .auth()
      .getUser(uid)
      .catch((e: unknown) => {
        throw new MonkeyError(
          500, // this should never happen, but it does. it mightve been caused by auth token cache, will see if disabling cache fixes it
          "Auth user not found, even though the token got decoded",
          JSON.stringify({
            uid,
            email,
            stack: e instanceof Error ? e.stack : JSON.stringify(e),
          }),
          uid
        );
      })
  ).emailVerified;
  if (isVerified) {
    throw new MonkeyError(400, "Email already verified");
  }

  const userInfo = await UserDAL.getPartialUser(
    uid,
    "request verification email",
    ["uid", "name", "email"]
  );

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

  return new MonkeyResponse2("Email sent", null);
}

export async function sendForgotPasswordEmail(
  req: MonkeyTypes.Request2<undefined, ForgotPasswordEmailRequest>
): Promise<MonkeyResponse2> {
  const { email } = req.body;
  await authSendForgotPasswordEmail(email);
  return new MonkeyResponse2(
    "Password reset request received. If the email is valid, you will receive an email shortly.",
    null
  );
}

export async function deleteUser(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getPartialUser(uid, "delete user", [
    "banned",
    "name",
    "email",
    "discordId",
  ]);

  if (userInfo.banned === true) {
    await BlocklistDal.add(userInfo);
  }

  //cleanup database
  await Promise.all([
    UserDAL.deleteUser(uid),
    deleteUserLogs(uid),
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
  await AuthUtil.deleteUser(uid);

  void addImportantLog(
    "user_deleted",
    `${userInfo.email} ${userInfo.name}`,
    uid
  );

  return new MonkeyResponse2("User deleted", null);
}

export async function resetUser(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getPartialUser(uid, "reset user", [
    "banned",
    "discordId",
    "email",
    "name",
  ]);
  if (userInfo.banned) {
    throw new MonkeyError(403, "Banned users cannot reset their account");
  }

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
  void addImportantLog("user_reset", `${userInfo.email} ${userInfo.name}`, uid);

  return new MonkeyResponse2("User reset", null);
}

export async function updateName(
  req: MonkeyTypes.Request2<undefined, UpdateUserNameRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { name } = req.body;

  const user = await UserDAL.getPartialUser(uid, "update name", [
    "name",
    "banned",
    "needsToChangeName",
    "lastNameChange",
  ]);

  if (user.banned) {
    throw new MonkeyError(403, "Banned users cannot change their name");
  }

  if (
    !user?.needsToChangeName &&
    Date.now() - (user.lastNameChange ?? 0) < MILLISECONDS_IN_DAY * 30
  ) {
    throw new MonkeyError(409, "You can change your name once every 30 days");
  }

  await UserDAL.updateName(uid, name, user.name);
  void addImportantLog(
    "user_name_updated",
    `changed name from ${user.name} to ${name}`,
    uid
  );

  return new MonkeyResponse2("User's name updated", null);
}

export async function clearPb(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  await UserDAL.clearPb(uid);
  await purgeUserFromDailyLeaderboards(
    uid,
    req.ctx.configuration.dailyLeaderboards
  );
  void addImportantLog("user_cleared_pbs", "", uid);

  return new MonkeyResponse2("User's PB cleared", null);
}

export async function optOutOfLeaderboards(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  await UserDAL.optOutOfLeaderboards(uid);
  await purgeUserFromDailyLeaderboards(
    uid,
    req.ctx.configuration.dailyLeaderboards
  );
  void addImportantLog("user_opted_out_of_leaderboards", "", uid);

  return new MonkeyResponse2("User opted out of leaderboards", null);
}

export async function checkName(
  req: MonkeyTypes.Request2<undefined, undefined, CheckNamePathParameters>
): Promise<MonkeyResponse2> {
  const { name } = req.params;
  const { uid } = req.ctx.decodedToken;

  const available = await UserDAL.isNameAvailable(name, uid);
  if (!available) {
    throw new MonkeyError(409, "Username unavailable");
  }

  return new MonkeyResponse2("Username available", null);
}

export async function updateEmail(
  req: MonkeyTypes.Request2<undefined, UpdateEmailRequestSchema>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  let { newEmail } = req.body;

  newEmail = newEmail.toLowerCase();

  try {
    await AuthUtil.updateUserEmail(uid, newEmail);
    await UserDAL.updateEmail(uid, newEmail);
  } catch (e) {
    if (e.code === "auth/email-already-exists") {
      throw new MonkeyError(
        409,
        "The email address is already in use by another account"
      );
    } else if (e.code === "auth/invalid-email") {
      throw new MonkeyError(400, "Invalid email address");
    } else if (e.code === "auth/too-many-requests") {
      throw new MonkeyError(429, "Too many requests. Please try again later");
    } else if (e.code === "auth/user-not-found") {
      throw new MonkeyError(
        404,
        "User not found in the auth system",
        "update email",
        uid
      );
    } else if (e.code === "auth/invalid-user-token") {
      throw new MonkeyError(401, "Invalid user token", "update email", uid);
    } else {
      throw e;
    }
  }

  void addImportantLog(
    "user_email_updated",
    `changed email to ${newEmail}`,
    uid
  );

  return new MonkeyResponse2("Email updated", null);
}

export async function updatePassword(
  req: MonkeyTypes.Request2<undefined, UpdatePasswordRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { newPassword } = req.body;

  await AuthUtil.updateUserPassword(uid, newPassword);

  return new MonkeyResponse2("Password updated", null);
}

type RelevantUserInfo = Omit<
  MonkeyTypes.DBUser,
  | "bananas"
  | "lbPersonalBests"
  | "inbox"
  | "nameHistory"
  | "lastNameChange"
  | "_id"
  | "lastReultHashes" //TODO fix typo
  | "note"
  | "ips"
  | "testActivity"
>;

function getRelevantUserInfo(user: MonkeyTypes.DBUser): RelevantUserInfo {
  return _.omit(user, [
    "bananas",
    "lbPersonalBests",
    "inbox",
    "nameHistory",
    "lastNameChange",
    "_id",
    "lastReultHashes", //TODO fix typo
    "note",
    "ips",
    "testActivity",
  ]) as RelevantUserInfo;
}

export async function getUser(
  req: MonkeyTypes.Request2
): Promise<GetUserResponse> {
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
        await AuthUtil.deleteUser(uid);
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

  const agentLog = buildAgentLog(req.raw);
  void addLog("user_data_requested", agentLog, uid);
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
  const testActivity = generateCurrentTestActivity(userInfo.testActivity);
  const relevantUserInfo = getRelevantUserInfo(userInfo);

  const resultFilterPresets: ResultFilters[] = (
    relevantUserInfo.resultFilterPresets ?? []
  ).map((it) => replaceObjectId(it));
  delete relevantUserInfo.resultFilterPresets;

  const tags = (relevantUserInfo.tags ?? []).map((it) => replaceObjectId(it));
  delete relevantUserInfo.tags;

  const customThemes = (relevantUserInfo.customThemes ?? []).map((it) =>
    replaceObjectId(it)
  );
  delete relevantUserInfo.customThemes;

  const userData: User = {
    ...relevantUserInfo,
    resultFilterPresets,
    tags,
    customThemes,
    isPremium,
    allTimeLbs,
    testActivity,
  };

  return new MonkeyResponse2("User data retrieved", {
    ...userData,
    inboxUnreadSize: inboxUnreadSize,
  });
}

export async function getOauthLink(
  req: MonkeyTypes.Request2
): Promise<GetDiscordOauthLinkResponse> {
  const { uid } = req.ctx.decodedToken;

  //build the url
  const url = await DiscordUtils.getOauthLink(uid);

  //return
  return new MonkeyResponse2("Discord oauth link generated", {
    url: url,
  });
}

export async function linkDiscord(
  req: MonkeyTypes.Request2<undefined, LinkDiscordRequest>
): Promise<LinkDiscordResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tokenType, accessToken, state } = req.body;

  if (!(await DiscordUtils.iStateValidForUser(state, uid))) {
    throw new MonkeyError(403, "Invalid user token");
  }

  const userInfo = await UserDAL.getPartialUser(uid, "link discord", [
    "banned",
    "discordId",
  ]);
  if (userInfo.banned) {
    throw new MonkeyError(403, "Banned accounts cannot link with Discord");
  }

  const { id: discordId, avatar: discordAvatar } =
    await DiscordUtils.getDiscordUser(tokenType, accessToken);

  if (userInfo.discordId !== undefined && userInfo.discordId !== "") {
    await UserDAL.linkDiscord(uid, userInfo.discordId, discordAvatar);
    return new MonkeyResponse2("Discord avatar updated", {
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

  if (await BlocklistDal.contains({ discordId })) {
    throw new MonkeyError(409, "The Discord account is blocked");
  }

  await UserDAL.linkDiscord(uid, discordId, discordAvatar);

  await GeorgeQueue.linkDiscord(discordId, uid);
  void addImportantLog("user_discord_link", `linked to ${discordId}`, uid);

  return new MonkeyResponse2("Discord account linked", {
    discordId,
    discordAvatar,
  });
}

export async function unlinkDiscord(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getPartialUser(uid, "unlink discord", [
    "banned",
    "discordId",
  ]);

  if (userInfo.banned) {
    throw new MonkeyError(403, "Banned accounts cannot unlink Discord");
  }

  const discordId = userInfo.discordId;
  if (discordId === undefined || discordId === "") {
    throw new MonkeyError(404, "User does not have a linked Discord account");
  }

  await GeorgeQueue.unlinkDiscord(discordId, uid);
  await UserDAL.unlinkDiscord(uid);
  void addImportantLog("user_discord_unlinked", discordId, uid);

  return new MonkeyResponse2("Discord account unlinked", null);
}

export async function addResultFilterPreset(
  req: MonkeyTypes.Request2<undefined, AddResultFilterPresetRequest>
): Promise<AddResultFilterPresetResponse> {
  const { uid } = req.ctx.decodedToken;
  const filter = req.body;
  const { maxPresetsPerUser } = req.ctx.configuration.results.filterPresets;

  const createdId = await UserDAL.addResultFilterPreset(
    uid,
    filter,
    maxPresetsPerUser
  );
  return new MonkeyResponse2(
    "Result filter preset created",
    createdId.toHexString()
  );
}

export async function removeResultFilterPreset(
  req: MonkeyTypes.Request2<
    undefined,
    undefined,
    RemoveResultFilterPresetPathParams
  >
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { presetId } = req.params;

  await UserDAL.removeResultFilterPreset(uid, presetId);
  return new MonkeyResponse2("Result filter preset deleted", null);
}

export async function addTag(
  req: MonkeyTypes.Request2<undefined, AddTagRequest>
): Promise<AddTagResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagName } = req.body;

  const tag = await UserDAL.addTag(uid, tagName);
  return new MonkeyResponse2("Tag updated", replaceObjectId(tag));
}

export async function clearTagPb(
  req: MonkeyTypes.Request2<undefined, undefined, TagIdPathParams>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { tagId } = req.params;

  await UserDAL.removeTagPb(uid, tagId);
  return new MonkeyResponse2("Tag PB cleared", null);
}

export async function editTag(
  req: MonkeyTypes.Request2<undefined, EditTagRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { tagId, newName } = req.body;

  await UserDAL.editTag(uid, tagId, newName);
  return new MonkeyResponse2("Tag updated", null);
}

export async function removeTag(
  req: MonkeyTypes.Request2<undefined, undefined, TagIdPathParams>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { tagId } = req.params;

  await UserDAL.removeTag(uid, tagId);
  return new MonkeyResponse2("Tag deleted", null);
}

export async function getTags(
  req: MonkeyTypes.Request2
): Promise<GetTagsResponse> {
  const { uid } = req.ctx.decodedToken;

  const tags = await UserDAL.getTags(uid);
  return new MonkeyResponse2("Tags retrieved", replaceObjectIds(tags));
}

export async function updateLbMemory(
  req: MonkeyTypes.Request2<undefined, UpdateLeaderboardMemoryRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { mode, language, rank } = req.body;
  const mode2 = req.body.mode2;

  await UserDAL.updateLbMemory(uid, mode, mode2, language, rank);
  return new MonkeyResponse2("Leaderboard memory updated", null);
}

export async function getCustomThemes(
  req: MonkeyTypes.Request2
): Promise<GetCustomThemesResponse> {
  const { uid } = req.ctx.decodedToken;
  const customThemes = await UserDAL.getThemes(uid);
  return new MonkeyResponse2(
    "Custom themes retrieved",
    replaceObjectIds(customThemes)
  );
}

export async function addCustomTheme(
  req: MonkeyTypes.Request2<undefined, AddCustomThemeRequest>
): Promise<AddCustomThemeResponse> {
  const { uid } = req.ctx.decodedToken;
  const { name, colors } = req.body;

  const addedTheme = await UserDAL.addTheme(uid, { name, colors });
  return new MonkeyResponse2("Custom theme added", replaceObjectId(addedTheme));
}

export async function removeCustomTheme(
  req: MonkeyTypes.Request2<undefined, DeleteCustomThemeRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { themeId } = req.body;
  await UserDAL.removeTheme(uid, themeId);
  return new MonkeyResponse2("Custom theme removed", null);
}

export async function editCustomTheme(
  req: MonkeyTypes.Request2<undefined, EditCustomThemeRequst>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { themeId, theme } = req.body;

  await UserDAL.editTheme(uid, themeId, theme);
  return new MonkeyResponse2("Custom theme updated", null);
}

export async function getPersonalBests(
  req: MonkeyTypes.Request2<GetPersonalBestsQuery>
): Promise<GetPersonalBestsResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mode, mode2 } = req.query;

  const data = (await UserDAL.getPersonalBests(uid, mode, mode2)) ?? null;
  return new MonkeyResponse2("Personal bests retrieved", data);
}

export async function getStats(
  req: MonkeyTypes.Request2
): Promise<GetStatsResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = (await UserDAL.getStats(uid)) ?? null;
  return new MonkeyResponse2("Personal stats retrieved", data);
}

export async function getFavoriteQuotes(
  req: MonkeyTypes.Request2
): Promise<GetFavoriteQuotesResponse> {
  const { uid } = req.ctx.decodedToken;

  const quotes = await UserDAL.getFavoriteQuotes(uid);

  return new MonkeyResponse2("Favorite quotes retrieved", quotes);
}

export async function addFavoriteQuote(
  req: MonkeyTypes.Request2<undefined, AddFavoriteQuoteRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  const { language, quoteId } = req.body;

  await UserDAL.addFavoriteQuote(
    uid,
    language,
    quoteId,
    req.ctx.configuration.quotes.maxFavorites
  );

  return new MonkeyResponse2("Quote added to favorites", null);
}

export async function removeFavoriteQuote(
  req: MonkeyTypes.Request2<undefined, RemoveFavoriteQuoteRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  const { quoteId, language } = req.body;
  await UserDAL.removeFavoriteQuote(uid, language, quoteId);

  return new MonkeyResponse2("Quote removed from favorites", null);
}

export async function getProfile(
  req: MonkeyTypes.Request2<GetProfileQuery, undefined, GetProfilePathParams>
): Promise<GetProfileResponse> {
  const { uidOrName } = req.params;

  const user = req.query.isUid
    ? await UserDAL.getUser(uidOrName, "get user profile")
    : await UserDAL.getUserByName(uidOrName, "get user profile");

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
    return new MonkeyResponse2("Profile retrived: banned user", baseProfile);
  }

  const allTimeLbs = await getAllTimeLbs(user.uid);

  const profileData = {
    ...baseProfile,
    inventory,
    details: profileDetails,
    allTimeLbs,
    uid: user.uid,
  } as UserProfile;

  return new MonkeyResponse2("Profile retrieved", profileData);
}

export async function updateProfile(
  req: MonkeyTypes.Request2<undefined, UpdateUserProfileRequest>
): Promise<UpdateUserProfileResponse> {
  const { uid } = req.ctx.decodedToken;
  const { bio, keyboard, socialProfiles, selectedBadgeId } = req.body;

  const user = await UserDAL.getPartialUser(uid, "update user profile", [
    "banned",
    "inventory",
  ]);

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

  const profileDetailsUpdates: Partial<UserProfileDetails> = {
    bio: sanitizeString(bio),
    keyboard: sanitizeString(keyboard),
    socialProfiles: _.mapValues(
      socialProfiles,
      sanitizeString
    ) as UserProfileDetails["socialProfiles"],
  };

  await UserDAL.updateProfile(uid, profileDetailsUpdates, user.inventory);

  return new MonkeyResponse2("Profile updated", profileDetailsUpdates);
}

export async function getInbox(
  req: MonkeyTypes.Request2
): Promise<GetUserInboxResponse> {
  const { uid } = req.ctx.decodedToken;

  const inbox = await UserDAL.getInbox(uid);

  return new MonkeyResponse2("Inbox retrieved", {
    inbox,
    maxMail: req.ctx.configuration.users.inbox.maxMail,
  });
}

export async function updateInbox(
  req: MonkeyTypes.Request2<undefined, UpdateUserInboxRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { mailIdsToMarkRead, mailIdsToDelete } = req.body;

  await UserDAL.updateInbox(
    uid,
    mailIdsToMarkRead ?? [],
    mailIdsToDelete ?? []
  );

  return new MonkeyResponse2("Inbox updated", null);
}

export async function reportUser(
  req: MonkeyTypes.Request2<undefined, ReportUserRequest>
): Promise<MonkeyResponse2> {
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
    comment: comment ?? "",
  };

  await ReportDAL.createReport(newReport, maxReports, contentReportLimit);

  return new MonkeyResponse2("User reported", null);
}

export async function setStreakHourOffset(
  req: MonkeyTypes.Request2<undefined, SetStreakHourOffsetRequest>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  const { hourOffset } = req.body;

  const user = await UserDAL.getPartialUser(uid, "update user profile", [
    "streak",
  ]);

  if (
    user.streak?.hourOffset !== undefined &&
    user.streak?.hourOffset !== null
  ) {
    throw new MonkeyError(403, "Streak hour offset already set");
  }

  await UserDAL.setStreakHourOffset(uid, hourOffset);

  void addImportantLog("user_streak_hour_offset_set", { hourOffset }, uid);

  return new MonkeyResponse2("Streak hour offset set", null);
}

export async function revokeAllTokens(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;
  await AuthUtil.revokeTokensByUid(uid);
  void addImportantLog("user_tokens_revoked", "", uid);
  return new MonkeyResponse2("All tokens revoked", null);
}

async function getAllTimeLbs(uid: string): Promise<AllTimeLbs> {
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
      : {
          rank: allTime15English.rank,
          count: allTime15English.count,
        };

  const english60 =
    allTime60English === false
      ? undefined
      : {
          rank: allTime60English.rank,
          count: allTime60English.count,
        };

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

export function generateCurrentTestActivity(
  testActivity: CountByYearAndDay | undefined
): TestActivity | undefined {
  const thisYear = Dates.startOfYear(new UTCDateMini());
  const lastYear = Dates.startOfYear(Dates.subYears(thisYear, 1));

  let thisYearData = testActivity?.[thisYear.getFullYear().toString()];
  let lastYearData = testActivity?.[lastYear.getFullYear().toString()];

  if (lastYearData === undefined && thisYearData === undefined)
    return undefined;

  lastYearData = lastYearData ?? [];
  thisYearData = thisYearData ?? [];

  //make sure lastYearData covers the full year
  if (lastYearData.length < Dates.getDaysInYear(lastYear)) {
    lastYearData.push(
      ...(new Array(Dates.getDaysInYear(lastYear) - lastYearData.length).fill(
        undefined
      ) as (number | null)[])
    );
  }
  //use enough days of the last year to have 372 days in total to always fill the first week of the graph
  lastYearData = lastYearData.slice(-372 + thisYearData.length);

  const lastDay = Dates.startOfDay(
    Dates.addDays(thisYear, thisYearData.length - 1)
  );

  return {
    testsByDays: [...lastYearData, ...thisYearData],
    lastDay: lastDay.valueOf(),
  };
}

export async function getTestActivity(
  req: MonkeyTypes.Request2
): Promise<GetTestActivityResponse> {
  const { uid } = req.ctx.decodedToken;
  const premiumFeaturesEnabled = req.ctx.configuration.users.premium.enabled;
  const user = await UserDAL.getPartialUser(uid, "testActivity", [
    "testActivity",
    "premium",
  ]);
  const userHasPremium = await UserDAL.checkIfUserIsPremium(uid, user);

  if (!premiumFeaturesEnabled) {
    throw new MonkeyError(503, "Premium features are disabled");
  }

  if (!userHasPremium) {
    throw new MonkeyError(503, "User does not have premium");
  }

  return new MonkeyResponse2(
    "Test activity data retrieved",
    user.testActivity ?? null
  );
}

async function firebaseDeleteUserIgnoreError(uid: string): Promise<void> {
  try {
    await AuthUtil.deleteUser(uid);
  } catch (e) {
    //ignore
  }
}

export async function getCurrentTestActivity(
  req: MonkeyTypes.Request2
): Promise<GetCurrentTestActivityResponse> {
  const { uid } = req.ctx.decodedToken;

  const user = await UserDAL.getPartialUser(uid, "current test activity", [
    "testActivity",
  ]);
  const data = generateCurrentTestActivity(user.testActivity);
  return new MonkeyResponse2(
    "Current test activity data retrieved",
    data ?? null
  );
}

export async function getStreak(
  req: MonkeyTypes.Request2
): Promise<GetStreakResponseSchema> {
  const { uid } = req.ctx.decodedToken;

  const user = await UserDAL.getPartialUser(uid, "streak", ["streak"]);

  return new MonkeyResponse2("Streak data retrieved", user.streak ?? null);
}
