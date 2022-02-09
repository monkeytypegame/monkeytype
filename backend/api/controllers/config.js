import ConfigDAO from "../../dao/config";
import { validateConfig } from "../../handlers/validation";

class ConfigController {
  static async getConfig(req, _res) {
    const { uid } = req.ctx.decodedToken;

    return await ConfigDAO.getConfig(uid);
  }

  static async saveConfig(req, res) {
    const { config } = req.body;
    const { uid } = req.ctx.decodedToken;

    validateConfig(config);
    await ConfigDAO.saveConfig(uid, config);

    return res.sendStatus(200);
  }
}

export default ConfigController;
