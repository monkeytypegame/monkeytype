import NewQuotesDao from "../../dao/new-quotes";

const { get, add, approve: _approve, refuse: _refuse } = NewQuotesDao;
import MonkeyError from "../../handlers/error";
import UsersDAO from "../../dao/user";
import { log } from "../../handlers/logger.js";
import { verify } from "../../handlers/captcha";

class NewQuotesController {
  static async getQuotes(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const userInfo = await UsersDAO.getUser(uid);
    if (!userInfo.quoteMod) {
      throw new MonkeyError(403, "You don't have permission to do this");
    }
    return await get();
  }

  static async addQuote(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { text, source, language, captcha } = req.body;
    if (!(await verify(captcha))) {
      throw new MonkeyError(400, "Captcha check failed");
    }
    return await add(text, source, language, uid);
  }

  static async approve(req, _res) {
    const { uid } = req.ctx.decodedToken;
    const { quoteId, editText, editSource } = req.body;
    const userInfo = await UsersDAO.getUser(uid);
    if (!userInfo.quoteMod) {
      throw new MonkeyError(403, "You don't have permission to do this");
    }
    const data = await _approve(quoteId, editText, editSource);
    log("system_quote_approved", data, uid);

    return data;
  }

  static async refuse(req, res) {
    const { quoteId } = req.body;

    await _refuse(quoteId);
    return res.sendStatus(200);
  }
}

export default NewQuotesController;
