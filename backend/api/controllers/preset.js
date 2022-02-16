const PresetDAO = require("../../dao/preset");
const { MonkeyResponse } = require("../../handlers/monkey-response");

class PresetController {
  static async getPresets(req, _res) {
    const { uid } = req.ctx.decodedToken;

    const data = await PresetDAO.getPresets(uid);
    return new MonkeyResponse("Preset retrieved", data);
  }

  static async addPreset(req, _res) {
    const { name, config } = req.body;
    const { uid } = req.ctx.decodedToken;

    await PresetDAO.addPreset(uid, name, config);
    return new MonkeyResponse("Preset updated");
  }

  static async editPreset(req, _res) {
    const { _id, name, config } = req.body;
    const { uid } = req.ctx.decodedToken;

    await PresetDAO.editPreset(uid, _id, name, config);

    return new MonkeyResponse("Preset updated");
  }

  static async removePreset(req, _res) {
    const { presetId } = req.body;
    const { uid } = req.ctx.decodedToken;

    await PresetDAO.removePreset(uid, presetId);

    return new MonkeyResponse("Preset deleted");
  }
}

module.exports = PresetController;
