import PresetDAO from "../../dao/presetDAO";
import {
  isTagPresetNameValid,
  validateConfig,
} from "../../handlers/validation";

class PresetController {
  static async addPreset(req, res, next) {
    try {
      const { name, config } = req.body;
      const { uid } = req.decodedToken;
      if (!isTagPresetNameValid(name)) next("Invalid preset name.");
      validateConfig(config);
      const createdInfo = await PresetsDAO.addPreset(uid, name, config);
      return res.sendStatus(200).json(createdInfo);
    } catch (e) {
      return next(e);
    }
  }

  static async editPreset(req, res, next) {
    try {
      const { id, name, config } = req.body;
      const { uid } = req.decodedToken;
      if (!isTagPresetNameValid(name)) next("Invalid preset name.");
      validateConfig(config);
      await PresetsDAO.editPreset(uid, id, name, config);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }

  static async removePreset(req, res, next) {
    try {
      const { id } = req.body;
      const { uid } = req.decodedToken;
      await PresetsDAO.removePreset(uid, id);
      return res.sendStatus(200);
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = PresetController;
