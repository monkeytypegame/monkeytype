const PresetDAO = require("../../dao/presetDAO");
const {
  isTagPresetNameValid,
  validateConfig,
} = require("../../handlers/validation");
const MonkeyError = require("../../handlers/error");

class PresetController {
  static async addPreset(req, res, next) {
    try {
      const { name, config } = req.body;
      const { uid } = req.decodedToken;
      if (!isTagPresetNameValid(name))
        throw new MonkeyError(400, "Invalid preset name.");
      validateConfig(config);
      await PresetDAO.addPreset(uid, name, config);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async editPreset(req, res, next) {
    try {
      const { id, name, config } = req.body;
      const { uid } = req.decodedToken;
      if (!isTagPresetNameValid(name))
        throw new MonkeyError(400, "Invalid preset name.");
      validateConfig(config);
      await PresetDAO.editPreset(uid, id, name, config);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async removePreset(req, res, next) {
    try {
      const { id } = req.body;
      const { uid } = req.decodedToken;
      await PresetDAO.removePreset(uid, id);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = PresetController;
