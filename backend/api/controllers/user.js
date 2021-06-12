import UsersDAO from "../../dao/usersDAO";
import BotDAO from "../../dao/botDAO";
import { isUsernameValid } from "../../handlers/validation";

class UserController {
  static async createNewUser(req, res, next) {
    try {
      const { name, email, uid } = req.body;
      await UsersDAO.addUser(name, email, uid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async updateName(req, res, next) {
    try {
      const { name } = req.body;
      if (!isUsernameValid(name)) return next("Username unavailable!");
      await UsersDAO.updateName();
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async getUser(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const userInfo = await UsersDAO.getUser(uid);
      return res.status(200).json(userInfo);
    } catch (e) {
      return next(e);
    }
  }

  static async linkDiscord(req, res ,next){
    try {
      const { uid } = req.decodedToken;
      let discordFetch = await fetch("https://discord.com/api/users/@me", {
        headers: {
          authorization: `${req.tokenType} ${req.accessToken}`,
        },
      });
      discordFetch = await discordFetch.json();
      const did = discordFetch.id;
      let user;
      try{
        user = await UsersDAO.getUserByDiscordId(did);
      } catch(e) {
        user = null;
      }
      if (user !== null){
        return next("This Discord account is already linked to a different account");
      }
      await UsersDAO.linkDiscord(uid, did);
      await BotDAO.linkDiscord(uid, did);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

}

module.exports = UserController;
