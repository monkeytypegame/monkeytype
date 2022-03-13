import UsersDAO from "../../dao/user";
import BotDAO from "../../dao/bot";
import MonkeyError from "../../utils/error";
import Logger from "../../utils/logger";
import { MonkeyResponse } from "../../utils/monkey-response";
import { linkAccount } from "../../utils/discord";
import { buildAgentLog } from "../../utils/misc";

class UserController {
  static async createNewUser(
    req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    const { name } = req.body;
    const { email, uid } = req.ctx.decodedToken;

    await UsersDAO.addUser(name, email, uid);
    Logger.log("user_created", `${name} ${email}`, uid);

    return new MonkeyResponse("User created");
  }

  static async deleteUser(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;

    const userInfo = await UsersDAO.getUser(uid);
    await UsersDAO.deleteUser(uid);
    Logger.log("user_deleted", `${userInfo.email} ${userInfo.name}`, uid);

    return new MonkeyResponse("User deleted");
  }

  static async updateName(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { name } = req.body;

    const oldUser = await UsersDAO.getUser(uid);
    await UsersDAO.updateName(uid, name);
    Logger.log(
      "user_name_updated",
      `changed name from ${oldUser.name} to ${name}`,
      uid
    );

    return new MonkeyResponse("User's name updated");
  }

  static async clearPb(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;

    await UsersDAO.clearPb(uid);
    Logger.log("user_cleared_pbs", "", uid);

    return new MonkeyResponse("User's PB cleared");
  }

  static async checkName(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { name } = req.params;

    const available = await UsersDAO.isNameAvailable(name);
    if (!available) {
      throw new MonkeyError(409, "Username unavailable");
    }

    return new MonkeyResponse("Username available");
  }

  static async updateEmail(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { newEmail } = req.body;

    try {
      await UsersDAO.updateEmail(uid, newEmail);
    } catch (e) {
      throw new MonkeyError(404, e.message, "update email", uid);
    }

    Logger.log("user_email_updated", `changed email to ${newEmail}`, uid);

    return new MonkeyResponse("Email updated");
  }

  static async getUser(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
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
    Logger.log("user_data_requested", agentLog, uid);

    return new MonkeyResponse("User data retrieved", userInfo);
  }

  static async linkDiscord(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const {
      data: { tokenType, accessToken },
    } = req.body;

    const userInfo = await UsersDAO.getUser(uid);
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
        "This Discord account is already linked to a different account"
      );
    }

    await UsersDAO.linkDiscord(uid, discordId);
    await BotDAO.linkDiscord(uid, discordId);
    Logger.log("user_discord_link", `linked to ${discordId}`, uid);

    return new MonkeyResponse("Discord account linked", discordId);
  }

  static async unlinkDiscord(
    req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;

    const userInfo = await UsersDAO.getUser(uid);
    if (!userInfo.discordId) {
      throw new MonkeyError(404, "User does not have a linked Discord account");
    }

    await BotDAO.unlinkDiscord(uid, userInfo.discordId);
    await UsersDAO.unlinkDiscord(uid);
    Logger.log("user_discord_unlinked", userInfo.discordId, uid);

    return new MonkeyResponse("Discord account unlinked");
  }

  static async addTag(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { tagName } = req.body;

    const tag = await UsersDAO.addTag(uid, tagName);
    return new MonkeyResponse("Tag updated", tag);
  }

  static async clearTagPb(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { tagId } = req.params;

    await UsersDAO.removeTagPb(uid, tagId);
    return new MonkeyResponse("Tag PB cleared");
  }

  static async editTag(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { tagId, newName } = req.body;

    await UsersDAO.editTag(uid, tagId, newName);
    return new MonkeyResponse("Tag updated");
  }

  static async removeTag(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { tagId } = req.params;

    await UsersDAO.removeTag(uid, tagId);
    return new MonkeyResponse("Tag deleted");
  }

  static async getTags(req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;

    const tags = await UsersDAO.getTags(uid);
    return new MonkeyResponse("Tags retrieved", tags ?? []);
  }

  static async updateLbMemory(
    req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { mode, mode2, language, rank } = req.body;

    await UsersDAO.updateLbMemory(uid, mode, mode2, language, rank);
    return new MonkeyResponse("Leaderboard memory updated");
  }

  static async getCustomThemes(
    req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const customThemes = await UsersDAO.getThemes(uid);
    return new MonkeyResponse("Custom themes retrieved", customThemes);
  }

  static async addCustomTheme(
    req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { name, colors } = req.body;

    const addedTheme = await UsersDAO.addTheme(uid, { name, colors });
    return new MonkeyResponse("Custom theme added", {
      theme: addedTheme,
    });
  }

  static async removeCustomTheme(
    req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { themeId } = req.body;
    await UsersDAO.removeTheme(uid, themeId);
    return new MonkeyResponse("Custom theme removed");
  }

  static async editCustomTheme(
    req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { themeId, theme } = req.body;

    await UsersDAO.editTheme(uid, themeId, theme);
    return new MonkeyResponse("Custom theme updated");
  }

  static async getPersonalBests(
    req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    const { uid } = req.ctx.decodedToken;
    const { mode, mode2 } = req.query;

    const data = (await UsersDAO.getPersonalBests(uid, mode, mode2)) ?? null;
    return new MonkeyResponse("Personal bests retrieved", data);
  }
}

export default UserController;
