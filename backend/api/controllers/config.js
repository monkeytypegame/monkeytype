const ConfigDAO = require("../../dao/config");
const { validateConfig } = require("../../handlers/validation");

class ConfigController {
  static async getConfig(req, res) {
    const { uid } = req.decodedToken;
    let config = await ConfigDAO.getConfig(uid);
    return res.status(200).json(config);
  }
  static async saveConfig(req, res) {
    const { config } = req.body;
    const { uid } = req.decodedToken;
    validateConfig(config);
    await ConfigDAO.saveConfig(uid, config);
    return res.sendStatus(200);
  }
}

module.exports = ConfigController;
