const NewQuotesDAO = require("../../dao/new-quotes");
const MonkeyError = require("../../handlers/error");
const UserDAO = require("../../dao/user");
const Logger = require("../../handlers/logger.js");
const Captcha = require("../../handlers/captcha");

class NewQuotesController {
  static async getQuotes(req, _res) {
    const { uid } = req.decodedToken;
    const userInfo = await UserDAO.getUser(uid);
    if (!userInfo.quoteMod) {
      throw new MonkeyError(403, "You don't have permission to do this");
    }
    return await NewQuotesDAO.get();
  }

  static async addQuote(req, _res) {
    const { uid } = req.decodedToken;
    const { text, source, language, captcha } = req.body;
    if (!(await Captcha.verify(captcha))) {
      throw new MonkeyError(400, "Captcha check failed");
    }
    return await NewQuotesDAO.add(text, source, language, uid);
  }

  static async approve(req, _res) {
    const { uid } = req.decodedToken;
    const { quoteId, editText, editSource } = req.body;
    const userInfo = await UserDAO.getUser(uid);
    if (!userInfo.quoteMod) {
      throw new MonkeyError(403, "You don't have permission to do this");
    }
    const data = await NewQuotesDAO.approve(quoteId, editText, editSource);
    Logger.log("system_quote_approved", data, uid);

    return data;
  }

  static async refuse(req, res) {
    const { uid } = req.decodedToken;
    const { quoteId } = req.body;

    await NewQuotesDAO.refuse(quoteId, uid);
    return res.sendStatus(200);
  }
}

module.exports = NewQuotesController;
