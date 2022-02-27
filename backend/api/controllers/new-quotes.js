import NewQuotesDao from "../../dao/new-quotes";
import MonkeyError from "../../handlers/error";
import UsersDAO from "../../dao/user";
import Logger from "../../handlers/logger.js";
import { verify } from "../../handlers/captcha";
import { MonkeyResponse } from "../../handlers/monkey-response";

class NewQuotesController {
  static async getQuotes(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const userInfo = await UsersDAO.getUser(uid);
    if (!userInfo.quoteMod) {
      throw new MonkeyError(403, "You don't have permission to do this");
    }
    const data = await NewQuotesDao.get();
    return new MonkeyResponse("Quote submissions retrieved", data);
  }

  static async addQuote(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { text, source, language, captcha } = req.body;
    if (!(await verify(captcha))) {
      throw new MonkeyError(400, "Captcha check failed");
    }
    await NewQuotesDao.add(text, source, language, uid);
    return new MonkeyResponse("Quote submission added");
  }

  static async approve(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { quoteId, editText, editSource } = req.body;
    const userInfo = await UsersDAO.getUser(uid);
    if (!userInfo.quoteMod) {
      throw new MonkeyError(403, "You don't have permission to do this");
    }
    const data = await NewQuotesDao.approve(quoteId, editText, editSource);
    Logger.log("system_quote_approved", data, uid);

    return new MonkeyResponse(data.message, data.quote);
  }

  static async refuse(req, _res) {
    const { quoteId } = req.body;

    await NewQuotesDao.refuse(quoteId);
    return new MonkeyResponse("Quote refused");
  }
}

export default NewQuotesController;
