const PresetDAO = require("../../dao/preset");
const {
  isTagPresetNameValid,
  validateConfig,
} = require("../../handlers/validation");
const MonkeyError = require("../../handlers/error");

class PresetController {
  static async getPresets(req, res, next) {
    try {
      const { uid } = req.decodedToken;
      let presets = await PresetDAO.getPresets(uid);
      return res.status(200).json(presets);
    } catch (e) {
      return next(e);
    }
  }

  static async addPreset(req, res, next) {
    try {
      const { name, config } = req.body;
      const { uid } = req.decodedToken;
      if (!isTagPresetNameValid(name))
        throw new MonkeyError(400, "Invalid preset name.");
      validateConfig(config);
      let preset = await PresetDAO.addPreset(uid, name, config);
      return res.status(200).json(preset);
    } catch (e) {
      return next(e);
    }
  }

  static async editPreset(req, res, next) {
    try {
      const { _id, name, config } = req.body;
      const { uid } = req.decodedToken;
      if (!isTagPresetNameValid(name))
        throw new MonkeyError(400, "Invalid preset name.");
      if (config) validateConfig(config);
      await PresetDAO.editPreset(uid, _id, name, config);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async removePreset(req, res, next) {
    try {
      const { _id } = req.body;
      const { uid } = req.decodedToken;
      await PresetDAO.removePreset(uid, _id);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = PresetController;
