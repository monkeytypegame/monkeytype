import _ from "lodash";
import * as UserDAL from "../../dal/user";
import MonkeyError from "../../utils/error";
import Logger from "../../utils/logger";
import { MonkeyResponse } from "../../utils/monkey-response";
import { getDiscordUser } from "../../utils/discord";
import { buildAgentLog, sanitizeString } from "../../utils/misc";
import * as George from "../../tasks/george";
import admin from "firebase-admin";
import { deleteAllApeKeys } from "../../dal/ape-keys";
import { deleteAllPresets } from "../../dal/preset";
import { deleteAll as deleteAllResults } from "../../dal/result";
import { deleteConfig } from "../../dal/config";

export async function createNewUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { name } = req.body;
  const { email, uid } = req.ctx.decodedToken;

  const available = await UserDAL.isNameAvailable(name);
  if (!available) {
    throw new MonkeyError(409, "Username unavailable");
  }

  await UserDAL.addUser(name, email, uid);
  Logger.logToDb("user_created", `${name} ${email}`, uid);

  return new MonkeyResponse("User created");
}

export async function deleteUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getUser(uid, "delete user");
  await UserDAL.deleteUser(uid);
  Logger.logToDb("user_deleted", `${userInfo.email} ${userInfo.name}`, uid);

  return new MonkeyResponse("User deleted");
}

export async function resetUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UserDAL.getUser(uid, "reset user");
  await Promise.all([
    UserDAL.resetUser(uid),
    deleteAllApeKeys(uid),
    deleteAllPresets(uid),
    deleteAllResults(uid),
    deleteConfig(uid),
  ]);
  Logger.logToDb("user_reset", `${userInfo.email} ${userInfo.name}`, uid);

  return new MonkeyResponse("User reset");
}

export async function updateName(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { name } = req.body;

  const oldUser = await UserDAL.getUser(uid, "update name");
  await UserDAL.updateName(uid, name);
  Logger.logToDb(
    "user_name_updated",
    `changed name from ${oldUser.name} to ${name}`,
    uid
  );

  return new MonkeyResponse("User's name updated");
}

export async function clearPb(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  await UserDAL.clearPb(uid);
  Logger.logToDb("user_cleared_pbs", "", uid);

  return new MonkeyResponse("User's PB cleared");
}

export async function checkName(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { name } = req.params;

  const available = await UserDAL.isNameAvailable(name);
  if (!available) {
    throw new MonkeyError(409, "Username unavailable");
  }

  return new MonkeyResponse("Username available");
}

export async function updateEmail(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { newEmail } = req.body;

  try {
    await UserDAL.updateEmail(uid, newEmail);
  } catch (e) {
    throw new MonkeyError(404, e.message, "update email", uid);
  }

  Logger.logToDb("user_email_updated", `changed email to ${newEmail}`, uid);

  return new MonkeyResponse("Email updated");
}

function getRelevantUserInfo(
  user: MonkeyTypes.User
): Partial<MonkeyTypes.User> {
  return _.omit(user, [
    "bananas",
    "lbPersonalBests",
    "quoteMod",
    "inbox",
    "nameHistory",
    "lastNameChange",
  ]);
}

export async function getUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  let userInfo: MonkeyTypes.User;
  try {
    userInfo = await UserDAL.getUser(uid, "get user");
  } catch (e) {
    if (e.status === 404) {
      await admin.auth().deleteUser(uid);
      throw new MonkeyError(
        404,
        "User not found. Please try to sign up again.",
        "get user",
        uid
      );
    }

    throw e;
  }

  const agentLog = buildAgentLog(req);
  Logger.logToDb("user_data_requested", agentLog, uid);

  let inboxUnreadSize = 0;
  if (req.ctx.configuration.users.inbox.enabled) {
    inboxUnreadSize = _.filter(userInfo.inbox, { read: false }).length;
  }

  const userData = {
    ...getRelevantUserInfo(userInfo),
    inboxUnreadSize: inboxUnreadSize,
  };

  return new MonkeyResponse("User data retrieved", userData);
}

export async function linkDiscord(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tokenType, accessToken } = req.body;

  const userInfo = await UserDAL.getUser(uid, "link discord");
  if (userInfo.banned) {
    throw new MonkeyError(403, "Banned accounts cannot link with Discord");
  }

  const { id: discordId, avatar: discordAvatar } = await getDiscordUser(
    tokenType,
    accessToken
  );

  if (userInfo.discordId) {
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

  George.linkDiscord(discordId, uid);
  Logger.logToDb("user_discord_link", `linked to ${discordId}`, uid);

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
  if (!userInfo.discordId) {
    throw new MonkeyError(404, "User does not have a linked Discord account");
  }

  George.unlinkDiscord(userInfo.discordId, uid);
  await UserDAL.unlinkDiscord(uid);
  Logger.logToDb("user_discord_unlinked", userInfo.discordId, uid);

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

  await UserDAL.removeResultFilterPreset(uid, presetId);
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

  await UserDAL.removeTagPb(uid, tagId);
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

  await UserDAL.removeTag(uid, tagId);
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
  const mode2 = req.body.mode2 as MonkeyTypes.Mode2<MonkeyTypes.Mode>;

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
  const { uid } = req.params;

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
  } = await UserDAL.getUser(uid, "get user profile");

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
  };

  if (banned) {
    return new MonkeyResponse("Profile retrived: banned user", baseProfile);
  }

  const profileData = {
    ...baseProfile,
    inventory,
    details: profileDetails,
  };

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

  const profileDetailsUpdates: Partial<MonkeyTypes.UserProfileDetails> = {
    bio: sanitizeString(bio),
    keyboard: sanitizeString(keyboard),
    socialProfiles: _.mapValues(socialProfiles, sanitizeString),
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
