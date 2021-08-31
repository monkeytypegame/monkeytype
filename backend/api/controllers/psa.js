const PsaDAO = require("../../dao/psa");

class PsaController {
  static async get(req, res, next) {
    try {
      let data = await PsaDAO.get();
      return res.status(200).json(data);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = PsaController;
