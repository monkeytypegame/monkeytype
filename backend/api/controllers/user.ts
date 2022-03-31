import UsersDAO from "../../dao/user";
import BotDAO from "../../dao/bot";
import MonkeyError from "../../utils/error";
import Logger from "../../utils/logger";
import { MonkeyResponse } from "../../utils/monkey-response";
import { linkAccount } from "../../utils/discord";
import { buildAgentLog } from "../../utils/misc";
import George from "../../tasks/george";

export async function createNewUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { name } = req.body;
  const { email, uid } = req.ctx.decodedToken;

  await UsersDAO.addUser(name, email, uid);
  Logger.logToDb("user_created", `${name} ${email}`, uid);

  return new MonkeyResponse("User created");
}

export async function deleteUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const userInfo = await UsersDAO.getUser(uid);
  await UsersDAO.deleteUser(uid);
  Logger.logToDb("user_deleted", `${userInfo.email} ${userInfo.name}`, uid);

  return new MonkeyResponse("User deleted");
}

export async function updateName(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { name } = req.body;

  const oldUser = await UsersDAO.getUser(uid);
  await UsersDAO.updateName(uid, name);
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

  await UsersDAO.clearPb(uid);
  Logger.logToDb("user_cleared_pbs", "", uid);

  return new MonkeyResponse("User's PB cleared");
}

export async function checkName(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { name } = req.params;

  const available = await UsersDAO.isNameAvailable(name);
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
    await UsersDAO.updateEmail(uid, newEmail);
  } catch (e) {
    throw new MonkeyError(404, e.message, "update email", uid);
  }

  Logger.logToDb("user_email_updated", `changed email to ${newEmail}`, uid);

  return new MonkeyResponse("Email updated");
}

export async function getUser(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { email, uid } = req.ctx.decodedToken;

  let userInfo;
  try {
    userInfo = await UsersDAO.getUser(uid);
  } catch (e) {
    if (email && uid) {
      userInfo = await UsersDAO.addUser(undefined, email, uid);
    } else {
      throw new MonkeyError(
        404,
        "User not found. Could not recreate user document.",
        "Tried to recreate user document but either email or uid is nullish",
        uid
      );
    }
  }

  const agentLog = buildAgentLog(req);
  Logger.logToDb("user_data_requested", agentLog, uid);

  return new MonkeyResponse("User data retrieved", userInfo);
}

export async function linkDiscord(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const {
    data: { tokenType, accessToken },
  } = req.body;

  const useRedisForBotTasks = req.ctx.configuration.useRedisForBotTasks.enabled;

  const userInfo = await UsersDAO.getUser(uid);
  if (userInfo.discordId) {
    throw new MonkeyError(
      409,
      "This account is already linked to a Discord account"
    );
  }
  if (userInfo.banned) {
    throw new MonkeyError(403, "Banned accounts cannot link with Discord");
  }

  const { id: discordId } = await linkAccount(tokenType, accessToken);

  if (!discordId) {
    throw new MonkeyError(
      500,
      "Could not get Discord account info",
      "discord id is undefined"
    );
  }

  const discordIdAvailable = await UsersDAO.isDiscordIdAvailable(discordId);
  if (!discordIdAvailable) {
    throw new MonkeyError(
      409,
      "This Discord account is linked to a different account"
    );
  }

  await UsersDAO.linkDiscord(uid, discordId);

  if (useRedisForBotTasks) {
    George.linkDiscord(discordId, uid);
  }
  await BotDAO.linkDiscord(uid, discordId);
  Logger.logToDb("user_discord_link", `linked to ${discordId}`, uid);

  return new MonkeyResponse("Discord account linked", discordId);
}

export async function unlinkDiscord(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const useRedisForBotTasks = req.ctx.configuration.useRedisForBotTasks.enabled;

  const userInfo = await UsersDAO.getUser(uid);
  if (!userInfo.discordId) {
    throw new MonkeyError(404, "User does not have a linked Discord account");
  }

  if (useRedisForBotTasks) {
    George.unlinkDiscord(userInfo.discordId, uid);
  }
  await BotDAO.unlinkDiscord(uid, userInfo.discordId);

  await UsersDAO.unlinkDiscord(uid);
  Logger.logToDb("user_discord_unlinked", userInfo.discordId, uid);

  return new MonkeyResponse("Discord account unlinked");
}

export async function addTag(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagName } = req.body;

  const tag = await UsersDAO.addTag(uid, tagName);
  return new MonkeyResponse("Tag updated", tag);
}

export async function clearTagPb(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId } = req.params;

  await UsersDAO.removeTagPb(uid, tagId);
  return new MonkeyResponse("Tag PB cleared");
}

export async function editTag(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId, newName } = req.body;

  await UsersDAO.editTag(uid, tagId, newName);
  return new MonkeyResponse("Tag updated");
}

export async function removeTag(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagId } = req.params;

  await UsersDAO.removeTag(uid, tagId);
  return new MonkeyResponse("Tag deleted");
}

export async function getTags(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const tags = await UsersDAO.getTags(uid);
  return new MonkeyResponse("Tags retrieved", tags ?? []);
}

export async function updateLbMemory(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mode, mode2, language, rank } = req.body;

  await UsersDAO.updateLbMemory(uid, mode, mode2, language, rank);
  return new MonkeyResponse("Leaderboard memory updated");
}

export async function getCustomThemes(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const customThemes = await UsersDAO.getThemes(uid);
  return new MonkeyResponse("Custom themes retrieved", customThemes);
}

export async function addCustomTheme(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { name, colors } = req.body;

  const addedTheme = await UsersDAO.addTheme(uid, { name, colors });
  return new MonkeyResponse("Custom theme added", {
    theme: addedTheme,
  });
}

export async function removeCustomTheme(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { themeId } = req.body;
  await UsersDAO.removeTheme(uid, themeId);
  return new MonkeyResponse("Custom theme removed");
}

export async function editCustomTheme(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { themeId, theme } = req.body;

  await UsersDAO.editTheme(uid, themeId, theme);
  return new MonkeyResponse("Custom theme updated");
}

export async function getPersonalBests(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  const { mode, mode2 } = req.query;

  const data = (await UsersDAO.getPersonalBests(uid, mode, mode2)) ?? null;
  return new MonkeyResponse("Personal bests retrieved", data);
}
