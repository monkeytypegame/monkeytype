const NewQuotesDAO = require("../../dao/new-quotes");
const MonkeyError = require("../../handlers/error");
const UserDAO = require("../../dao/user");

class NewQuotesController {
  static async getQuotes(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const userInfo = await UsersDAO.getUser(uid);
      if (!userInfo.quoteMod) {
        throw new MonkeyError(403, "You don't have permission to do this");
      }
      let data = await NewQuotesDAO.get();
      return res.status(200).json(data);
    } catch (e) {
      return next(e);
    }
  }

  static async addQuote(req, res, next) {
    try {
      let { uid } = req.decodedToken;
      let { text, source, language } = req.body;
      const userInfo = await UsersDAO.getUser(uid);
      if (!userInfo.quoteMod) {
        throw new MonkeyError(403, "You don't have permission to do this");
      }
      let data = await NewQuotesDAO.add(text, source, language, uid);
      return res.status(200).json(data);
    } catch (e) {
      return next(e);
    }
  }

  static async approve(req, res, next) {
    try {
      let { uid } = req.decodedToken;
      let { quoteId } = req.body;
      const userInfo = await UsersDAO.getUser(uid);
      if (!userInfo.quoteMod) {
        throw new MonkeyError(403, "You don't have permission to do this");
      }
      let data = await NewQuotesDAO.approve(quoteId, uid);
      return res.status(200).json(data);
    } catch (e) {
      return next(e);
    }
  }

  static async refuse(req, res, next) {
    try {
      let { uid } = req.decodedToken;
      let { quoteId } = req.body;
      await NewQuotesDAO.refuse(quoteId, uid);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = NewQuotesController;
