const PsaDAO = require("../../dao/psa");
const { MonkeyResponse } = require("../../handlers/monkey-response");

class PsaController {
  static async get(_req, _res) {
    let data = await PsaDAO.get();
    return new MonkeyResponse("PSA retrieved", data);
  }
}

module.exports = PsaController;
