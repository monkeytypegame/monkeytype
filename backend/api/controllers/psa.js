const PsaDAO = require("../../dao/psa");
const { MonkeyResponse } = require("../../handlers/response");

class PsaController {
  static async get(req, res) {
    let data = await PsaDAO.get();
    return new MonkeyResponse("PSA retrieved", data);
  }
}

module.exports = PsaController;
