import ConfigDAO from "../../dao/configDAO";
import { validateConfig } from "../../handlers/validation";

class ConfigController {
  static async saveConfig(req, res, next) {
    try {
      const { config } = req.body;
      const { uid } = req.decodedToken;
      validateConfig(config);
      await ConfigDAO.saveConfig(uid, config);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = ConfigController;
