const NewQuotesDAO = require("../../dao/new-quotes");
const MonkeyError = require("../../handlers/error");
const UserDAO = require("../../dao/user");
const Logger = require("../../handlers/logger.js");
const Captcha = require("../../handlers/captcha");
const { MonkeyResponse } = require("../../handlers/monkey-response");

class NewQuotesController {
  static async getQuotes(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const userInfo = await UserDAO.getUser(uid);
    if (!userInfo.quoteMod) {
      throw new MonkeyError(403, "You don't have permission to do this");
    }
    const data = await NewQuotesDAO.get();
    return new MonkeyResponse("Quote submissions retrieved", data);
  }

  static async addQuote(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { text, source, language, captcha } = req.body;
    if (!(await Captcha.verify(captcha))) {
      throw new MonkeyError(400, "Captcha check failed");
    }
    await NewQuotesDAO.add(text, source, language, uid);
    return new MonkeyResponse("Quote submission added");
  }

  static async approve(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { quoteId, editText, editSource } = req.body;
    const userInfo = await UserDAO.getUser(uid);
    if (!userInfo.quoteMod) {
      throw new MonkeyError(403, "You don't have permission to do this");
    }
    const data = await NewQuotesDAO.approve(quoteId, editText, editSource);
    Logger.log("system_quote_approved", data, uid);

    return new MonkeyResponse("Quote approved");
  }

  static async refuse(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { quoteId } = req.body;

    await NewQuotesDAO.refuse(quoteId, uid);
    return new MonkeyResponse("Quote refused");
  }
}

module.exports = NewQuotesController;
