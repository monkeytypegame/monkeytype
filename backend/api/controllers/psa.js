const PsaDAO = require("../../dao/psa");
const { MonkeyResponse } = require("../../middlewares/api-utils");

class PsaController {
  static async get(req, res) {
    let data = await PsaDAO.get();
    return new MonkeyResponse(200, "PSA fetch successfully", data);
  }
}

module.exports = PsaController;
