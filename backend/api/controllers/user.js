const UsersDAO = require("../../dao/user");
const BotDAO = require("../../dao/bot");
const { isUsernameValid } = require("../../handlers/validation");


// import UsersDAO from "../../dao/user";
// import BotDAO from "../../dao/bot";
// import { isUsernameValid } from "../../handlers/validation";

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

  static async deleteUser(req, res, next) {
    try {
      const { uid } = req.body;
      await UsersDAO.deleteUser(uid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async updateName(req, res, next) {
    try {
      const { name } = req.body;
      if (!isUsernameValid(name)) return res.status(400).json({message:"Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -"});
      await UsersDAO.updateName();
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async checkName(req, res, next) {
    try {
      const { name } = req.body;
      if (!isUsernameValid(name)) return next({status: 400, message: "Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -"});
      const available = await UsersDAO.isNameAvailable(name);
      if(!available) return res.status(400).json({message:"Username unavailable"});
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
