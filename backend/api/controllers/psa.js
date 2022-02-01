const PsaDAO = require("../../dao/psa");

class PsaController {
  static async get(req, res) {
    let data = await PsaDAO.get();
    return res.status(200).json(data);
  }
}

module.exports = PsaController;
