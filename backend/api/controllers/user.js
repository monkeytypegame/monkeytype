const UsersDAO = require("../../dao/user");
const BotDAO = require("../../dao/bot");
const { isUsernameValid } = require("../../handlers/validation");
const MonkeyError = require("../../handlers/error");
const fetch = require("node-fetch");
const Logger = require("./../../handlers/logger.js");
const uaparser = require("ua-parser-js");

class UserController {
  static async createNewUser(req, res) {
    const { name } = req.body;
    const { email, uid } = req.ctx.decodedToken;

    await UsersDAO.addUser(name, email, uid);
    Logger.log("user_created", `${name} ${email}`, uid);

    return res.sendStatus(200);
  }

  static async deleteUser(req, res) {
    const { uid } = req.ctx.decodedToken;
    const userInfo = await UsersDAO.getUser(uid);

    await UsersDAO.deleteUser(uid);
    Logger.log("user_deleted", `${userInfo.email} ${userInfo.name}`, uid);

    return res.sendStatus(200);
  }

  static async updateName(req, res) {
    const { uid } = req.ctx.decodedToken;
    const { name } = req.body;

    if (!isUsernameValid(name)) {
      return res.status(400).json({
        message:
          "Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -",
      });
    }

    const olduser = await UsersDAO.getUser(uid);
    await UsersDAO.updateName(uid, name);
    Logger.log(
      "user_name_updated",
      `changed name from ${olduser.name} to ${name}`,
      uid
    );

    return res.sendStatus(200);
  }

  static async clearPb(req, res) {
    const { uid } = req.ctx.decodedToken;

    await UsersDAO.clearPb(uid);
    Logger.log("user_cleared_pbs", "", uid);

    return res.sendStatus(200);
  }

  static async checkName(req, res) {
    const { name } = req.params;

    if (!isUsernameValid(name)) {
      throw new MonkeyError(
        400,
        "Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -"
      );
    }

    const available = await UsersDAO.isNameAvailable(name);
    if (!available) {
      return res.status(400).json({ message: "Username unavailable" });
    }

    return res.sendStatus(200);
  }

  static async updateEmail(req, res) {
    const { uid } = req.ctx.decodedToken;
    const { newEmail } = req.body;

    try {
      await UsersDAO.updateEmail(uid, newEmail);
    } catch (e) {
      throw new MonkeyError(400, e.message, "update email", uid);
    }
    Logger.log("user_email_updated", `changed email to ${newEmail}`, uid);

    return res.sendStatus(200);
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

    return userInfo;
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

    let discordFetch = await fetch("https://discord.com/api/users/@me", {
      headers: {
        authorization: `${req.body.data.tokenType} ${req.body.data.accessToken}`,
      },
    });
    discordFetch = await discordFetch.json();
    const did = discordFetch.id;
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

    return {
      message: "Discord account linked",
      did,
    };
  }

  static async unlinkDiscord(req, res) {
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

    return res.sendStatus(200);
  }

  static async addTag(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { tagName } = req.body;

    return await UsersDAO.addTag(uid, tagName);
  }

  static async clearTagPb(req, res) {
    const { uid } = req.ctx.decodedToken;
    const { tagId } = req.params;

    await UsersDAO.removeTagPb(uid, tagId);

    return res.sendStatus(200);
  }

  static async editTag(req, res) {
    const { uid } = req.ctx.decodedToken;
    const { tagId, newName } = req.body;

    await UsersDAO.editTag(uid, tagId, newName);

    return res.sendStatus(200);
  }

  static async removeTag(req, res) {
    const { uid } = req.ctx.decodedToken;
    const { tagId } = req.params;

    await UsersDAO.removeTag(uid, tagId);

    return res.sendStatus(200);
  }

  static async getTags(req, _res) {
    const { uid } = req.ctx.decodedToken;

    return await UsersDAO.getTags(uid);
  }

  static async updateLbMemory(req, res) {
    const { uid } = req.ctx.decodedToken;
    const { mode, mode2, language, rank } = req.body;

    await UsersDAO.updateLbMemory(uid, mode, mode2, language, rank);

    return res.sendStatus(200);
  }
}

module.exports = UserController;
