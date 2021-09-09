const NewQuotesDAO = require("../../dao/new-quotes");
const MonkeyError = require("../../handlers/error");

class NewQuotesController {
  static async getQuotes(req, res, next) {
    try {
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
      let data = await NewQuotesDAO.approve(quoteId, uid);
      return res.status(200).json(data);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = NewQuotesController;
