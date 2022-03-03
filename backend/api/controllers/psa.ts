import PsaDAO from "../../dao/psa";
import { MonkeyResponse } from "../../utils/monkey-response";

class PsaController {
  static async get(_req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    const data = await PsaDAO.get();
    return new MonkeyResponse("PSAs retrieved", data);
  }
}

export default PsaController;
