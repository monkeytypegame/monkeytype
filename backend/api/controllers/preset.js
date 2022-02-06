const PresetDAO = require("../../dao/preset");
const {
  isTagPresetNameValid,
  validateConfig,
} = require("../../handlers/validation");
const MonkeyError = require("../../handlers/error");

class PresetController {
  static async getPresets(req, res) {
    const { uid } = req.ctx.decodedToken;

    return await PresetDAO.getPresets(uid);
  }

  static async addPreset(req, res) {
    const { name, config } = req.body;
    const { uid } = req.ctx.decodedToken;

    return await PresetDAO.addPreset(uid, name, config);
  }

  static async editPreset(req, res) {
    const { _id, name, config } = req.body;
    const { uid } = req.ctx.decodedToken;

    await PresetDAO.editPreset(uid, _id, name, config);

    return res.sendStatus(200);
  }

  static async removePreset(req, res) {
    const { _id } = req.body;
    const { uid } = req.ctx.decodedToken;

    await PresetDAO.removePreset(uid, _id);

    return res.sendStatus(200);
  }
}

module.exports = PresetController;
