const NewQuotesDAO = require("../../dao/new-quotes");
const MonkeyError = require("../../handlers/error");
const UserDAO = require("../../dao/user");
const Logger = require("../../handlers/logger.js");

class NewQuotesController {
  static async getQuotes(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      const userInfo = await UserDAO.getUser(uid);
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
      if (text === "" || source === "") {
        throw new MonkeyError(400, "Please fill all the fields");
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
      let { quoteId, editText, editSource } = req.body;
      const userInfo = await UserDAO.getUser(uid);
      if (!userInfo.quoteMod) {
        throw new MonkeyError(403, "You don't have permission to do this");
      }
      if (editText === "" || editSource === "") {
        throw new MonkeyError(400, "Please fill all the fields");
      }
      let data = await NewQuotesDAO.approve(quoteId, editText, editSource);
      Logger.log("system_quote_approved", data, uid);
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
