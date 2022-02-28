import _ from "lodash";
import UsersDAO from "../../dao/user";
import BotDAO from "../../dao/bot";
import { isUsernameValid } from "../../handlers/validation";
import MonkeyError from "../../handlers/error";
import fetch from "node-fetch";
import Logger from "./../../handlers/logger.js";
import uaparser from "ua-parser-js";
import { MonkeyResponse } from "../../handlers/monkey-response";

function cleanUser(user) {
  return _.omit(user, "apeKeys");
}

class UserController {
  static async createNewUser(req, _res) {
    const { name } = req.body;
    const { email, uid } = req.ctx.decodedToken;

    await UsersDAO.addUser(name, email, uid);
    Logger.log("user_created", `${name} ${email}`, uid);
    return new MonkeyResponse("User created");
  }

  static async deleteUser(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const userInfo = await UsersDAO.getUser(uid);

    await UsersDAO.deleteUser(uid);
    Logger.log("user_deleted", `${userInfo.email} ${userInfo.name}`, uid);
    return new MonkeyResponse("User deleted");
  }

  static async updateName(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { name } = req.body;
    if (!isUsernameValid(name))
      throw new MonkeyError(
        400,
        "Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -"
      );
    let olduser = await UsersDAO.getUser(uid);
    await UsersDAO.updateName(uid, name);
    Logger.log(
      "user_name_updated",
      `changed name from ${olduser.name} to ${name}`,
      uid
    );
    return new MonkeyResponse("User's name updated");
  }

  static async clearPb(req, _res) {
    const { uid } = req.ctx.decodedToken;

    await UsersDAO.clearPb(uid);
    Logger.log("user_cleared_pbs", "", uid);
    return new MonkeyResponse("User's PB cleared");
  }

  static async checkName(req, _res) {
    const { name } = req.params;

    if (!isUsernameValid(name)) {
      throw new MonkeyError(
        400,
        "Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -"
      );
    }

    const available = await UsersDAO.isNameAvailable(name);
    if (!available) throw new MonkeyError(400, "Username unavailable");
    return new MonkeyResponse("Username available");
  }

  static async updateEmail(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { newEmail } = req.body;

    try {
      await UsersDAO.updateEmail(uid, newEmail);
    } catch (e) {
      throw new MonkeyError(400, e.message, "update email", uid);
    }
    Logger.log("user_email_updated", `changed email to ${newEmail}`, uid);
    return new MonkeyResponse("Email updated");
  }

  static async getUser(req, _res) {
    const { email, uid } = req.ctx.decodedToken;

    let userInfo;
    try {
      userInfo = await UsersDAO.getUser(uid);
    } catch (e) {
      if (email && uid) {
        userInfo = await UsersDAO.addUser(undefined, email, uid);
      } else {
        throw new MonkeyError(
          400,
          "User not found. Could not recreate user document.",
          "Tried to recreate user document but either email or uid is nullish",
          uid
        );
      }
    }
    let agent = uaparser(req.headers["user-agent"]);
    let logobj = {
      ip:
        req.headers["cf-connecting-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.ip ||
        "255.255.255.255",
      agent:
        agent.os.name +
        " " +
        agent.os.version +
        " " +
        agent.browser.name +
        " " +
        agent.browser.version,
    };
    if (agent.device.vendor) {
      logobj.device =
        agent.device.vendor +
        " " +
        agent.device.model +
        " " +
        agent.device.type;
    }
    Logger.log("user_data_requested", logobj, uid);
    return new MonkeyResponse("User data retrieved", cleanUser(userInfo));
  }

  static async linkDiscord(req, _res) {
    const { uid } = req.ctx.decodedToken;

    let requser;
    try {
      requser = await UsersDAO.getUser(uid);
    } catch (e) {
      requser = null;
    }
    if (requser?.banned === true) {
      throw new MonkeyError(403, "Banned accounts cannot link with Discord");
    }

    const discordFetch = await fetch("https://discord.com/api/users/@me", {
      headers: {
        authorization: `${req.body.data.tokenType} ${req.body.data.accessToken}`,
      },
    });
    const discordFetchJSON = await discordFetch.json();
    const did = discordFetchJSON.id;
    if (!did) {
      throw new MonkeyError(
        500,
        "Could not get Discord account info",
        "did is undefined"
      );
    }
    let user;
    try {
      user = await UsersDAO.getUserByDiscordId(did);
    } catch (e) {
      user = null;
    }
    if (user !== null) {
      throw new MonkeyError(
        400,
        "This Discord account is already linked to a different account"
      );
    }
    await UsersDAO.linkDiscord(uid, did);
    await BotDAO.linkDiscord(uid, did);
    Logger.log("user_discord_link", `linked to ${did}`, uid);
    return new MonkeyResponse("Discord account linked ", did);
  }

  static async unlinkDiscord(req, _res) {
    const { uid } = req.ctx.decodedToken;

    let userInfo;
    try {
      userInfo = await UsersDAO.getUser(uid);
    } catch (e) {
      throw new MonkeyError(400, "User not found.");
    }
    if (!userInfo.discordId) {
      throw new MonkeyError(400, "User does not have a linked Discord account");
    }
    await BotDAO.unlinkDiscord(uid, userInfo.discordId);
    await UsersDAO.unlinkDiscord(uid);
    Logger.log("user_discord_unlinked", userInfo.discordId, uid);
    return new MonkeyResponse("Discord account unlinked ");
  }

  static async addTag(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { tagName } = req.body;
    let tag = await UsersDAO.addTag(uid, tagName);
    return new MonkeyResponse("Tag updated", tag);
  }

  static async clearTagPb(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { tagId } = req.params;
    await UsersDAO.removeTagPb(uid, tagId);
    return new MonkeyResponse("Tag PB cleared");
  }

  static async editTag(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { tagId, newName } = req.body;
    await UsersDAO.editTag(uid, tagId, newName);
    return new MonkeyResponse("Tag updated");
  }

  static async removeTag(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { tagId } = req.params;
    await UsersDAO.removeTag(uid, tagId);
    return new MonkeyResponse("Tag deleted");
  }

  static async getTags(req, _res) {
    const { uid } = req.ctx.decodedToken;
    let tags = await UsersDAO.getTags(uid);
    if (tags == undefined) tags = [];
    return new MonkeyResponse("Tags retrieved", tags);
  }

  static async updateLbMemory(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { mode, mode2, language, rank } = req.body;

    await UsersDAO.updateLbMemory(uid, mode, mode2, language, rank);
    return new MonkeyResponse("Leaderboard memory updated");
  }
}

export default UserController;
