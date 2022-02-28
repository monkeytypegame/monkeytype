import { MonkeyResponse } from "../../handlers/monkey-response";

class ApeKeysController {
  static async getApeKey(_req: MonkeyTypes.Request): Promise<MonkeyResponse> {
    return new MonkeyResponse("ApeKey retrieved");
  }

  static async generateApeKey(
    _req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    return new MonkeyResponse("ApeKey generated");
  }

  static async updateApeKey(
    _req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    return new MonkeyResponse("ApeKey updated");
  }

  static async deleteApeKey(
    _req: MonkeyTypes.Request
  ): Promise<MonkeyResponse> {
    return new MonkeyResponse("ApeKey deleted");
  }
}

export default ApeKeysController;
