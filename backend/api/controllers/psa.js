import PsaDAO from "../../dao/psa";
import { MonkeyResponse } from "../../handlers/monkey-response";

class PsaController {
  static async get(_req, _res) {
    let data = await PsaDAO.get();
    return new MonkeyResponse("PSAs retrieved", data);
  }
}

export default PsaController;
