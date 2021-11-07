const UsersDAO = require("../../dao/user");
const BotDAO = require("../../dao/bot");
const {
  isUsernameValid,
  isTagPresetNameValid,
} = require("../../handlers/validation");
const MonkeyError = require("../../handlers/error");
const fetch = require("node-fetch");
const Logger = require("./../../handlers/logger.js");
const uaparser = require("ua-parser-js");

// import UsersDAO from "../../dao/user";
// import BotDAO from "../../dao/bot";
// import { isUsernameValid } from "../../handlers/validation";

class UserController {
  static async createNewUser(req, res, next) {
    try {
      const { name } = req.body;
      const { email, uid } = req.decodedToken;
      await UsersDAO.addUser(name, email, uid);
      Logger.log("user_created", `${name} ${email}`, uid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const userInfo = await UsersDAO.getUser(uid);
      await UsersDAO.deleteUser(uid);
      Logger.log("user_deleted", `${userInfo.email} ${userInfo.name}`, uid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async updateName(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { name } = req.body;
      if (!isUsernameValid(name))
        return res.status(400).json({
          message:
            "Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -",
        });
      let olduser = await UsersDAO.getUser(uid);
      await UsersDAO.updateName(uid, name);
      Logger.log(
        "user_name_updated",
        `changed name from ${olduser.name} to ${name}`,
        uid
      );
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async clearPb(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      await UsersDAO.clearPb(uid);
      Logger.log("user_cleared_pbs", ``, uid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async checkName(req, res, next) {
    try {
      const { name } = req.body;
      if (!isUsernameValid(name))
        return next({
          status: 400,
          message:
            "Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -",
        });
      const available = await UsersDAO.isNameAvailable(name);
      if (!available)
        return res.status(400).json({ message: "Username unavailable" });
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async updateEmail(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { newEmail } = req.body;
      await UsersDAO.updateEmail(uid, newEmail);
      Logger.log("user_email_updated", `changed email to ${newEmail}`, uid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async getUser(req, res, next) {
    try {
      const { email, uid } = req.decodedToken;
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
      return res.status(200).json(userInfo);
    } catch (e) {
      return next(e);
    }
  }

  static async linkDiscord(req, res, next) {
    try {
      const { uid } = req.decodedToken;

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
      return res.status(200).json({
        message: "Discord account linked",
        did,
      });
    } catch (e) {
      return next(e);
    }
  }

  static async unlinkDiscord(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      await UsersDAO.unlinkDiscord(uid);
      Logger.log("user_discord_unlinked", ``, uid);
      return res.status(200).send();
    } catch (e) {
      return next(e);
    }
  }

  static async addTag(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { tagName } = req.body;
      if (!isTagPresetNameValid(tagName))
        return res.status(400).json({
          message:
            "Tag name invalid. Name cannot contain special characters or more than 16 characters. Can include _ . and -",
        });
      let tag = await UsersDAO.addTag(uid, tagName);
      return res.status(200).json(tag);
    } catch (e) {
      return next(e);
    }
  }

  static async clearTagPb(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { tagid } = req.body;
      await UsersDAO.removeTagPb(uid, tagid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async editTag(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { tagid, newname } = req.body;
      if (!isTagPresetNameValid(newname))
        return res.status(400).json({
          message:
            "Tag name invalid. Name cannot contain special characters or more than 16 characters. Can include _ . and -",
        });
      await UsersDAO.editTag(uid, tagid, newname);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async removeTag(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { tagid } = req.body;
      await UsersDAO.removeTag(uid, tagid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async getTags(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      let tags = await UsersDAO.getTags(uid);
      if (tags == undefined) tags = [];
      return res.status(200).json(tags);
    } catch (e) {
      return next(e);
    }
  }

  static async updateLbMemory(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const { mode, mode2, language, rank } = req.body;
      await UsersDAO.updateLbMemory(uid, mode, mode2, language, rank);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = UserController;
