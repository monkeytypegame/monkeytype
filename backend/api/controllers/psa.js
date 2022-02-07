const PsaDAO = require("../../dao/psa");
const { MonkeyResponse } = require("../../handlers/response");

class PsaController {
  static async get(req, res) {
    let data = await PsaDAO.get();
    return new MonkeyResponse(200, "PSA retrieved", data);
  }
}

module.exports = PsaController;
