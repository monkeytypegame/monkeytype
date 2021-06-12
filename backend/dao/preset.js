const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const uuid = require("uuid");

class PresetDAO {
  static async addPreset(uid, name, config) {
    const count = await mongoDB().collection("presets").find({ uid }).count();
    if (count >= 10) throw new MonkeyError(409, "Too many presets");
    return await mongoDB()
      .collection("presets")
      .insertOne({ id: uuid.v4(), uid, name, config });
  }

  static async editPreset(uid, id, name, config) {
    const preset = await mongoDB().collection("presets").findOne({ uid, id });
    if (!preset) throw new MonkeyError(404, "Preset not found");
    return await mongoDB()
      .collection("presets")
      .updateOne({ uid, id }, { $set: { name, config } });
  }

  static async removePreset(uid, id) {
    const preset = await mongoDB().collection("presets").findOne({ uid, id });
    if (!preset) throw new MonkeyError(404, "Preset not found");
    return await mongoDB().collection("presets").remove({ uid, id });
  }
}

module.exports = PresetDAO;
