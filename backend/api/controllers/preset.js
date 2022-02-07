const PresetDAO = require("../../dao/preset");
const {
  isTagPresetNameValid,
  validateConfig,
} = require("../../handlers/validation");
const MonkeyError = require("../../handlers/error");
const { MonkeyResponse } = require("../../middlewares/api-utils");

class PresetController {
  static async getPresets(req, res) {
    const { uid } = req.ctx.decodedToken;

    const data = await PresetDAO.getPresets(uid);
    return new MonkeyResponse(200, "Get present successfully", data);
  }

  static async addPreset(req, res) {
    const { name, config } = req.body;
    const { uid } = req.ctx.decodedToken;

    await PresetDAO.addPreset(uid, name, config);
    return new MonkeyResponse(200, "Present added successfully");
  }

  static async editPreset(req, res) {
    const { _id, name, config } = req.body;
    const { uid } = req.ctx.decodedToken;

    await PresetDAO.editPreset(uid, _id, name, config);

    return new MonkeyResponse(200, "Present edited successfully");
  }

  static async removePreset(req, res) {
    const { _id } = req.body;
    const { uid } = req.ctx.decodedToken;

    await PresetDAO.removePreset(uid, _id);

    return new MonkeyResponse(200, "Present removed successfully");
  }
}

module.exports = PresetController;
