import UsersDAO from "../../dao/usersDAO";
import { isUsernameValid } from "../../handlers/validation";

class AuthController {
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
}

module.exports = AuthController;
