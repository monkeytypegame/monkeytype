const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const uuid = require("uuid");

class PresetDAO {
  static async getPresets(uid) {
    const preset = await mongoDB()
      .collection("presets")
      .find({ uid })
      .sort({ timestamp: -1 })
      .toArray(); // this needs to be changed to later take patreon into consideration
    return preset;
  }

  static async addPreset(uid, name, config) {
    const count = await mongoDB().collection("presets").find({ uid }).count();
    if (count >= 10) throw new MonkeyError(409, "Too many presets");
    const id = uuid.v4();
    await mongoDB()
      .collection("presets")
      .insertOne({ _id: id, uid, name, config });
    return {
      id,
      name,
    };
  }

  static async editPreset(uid, id, name, config) {
    const preset = await mongoDB().collection("presets").findOne({ uid, id });
    if (!preset) throw new MonkeyError(404, "Preset not found");
    if (config) {
      return await mongoDB()
        .collection("presets")
        .updateOne({ uid, _id: id }, { $set: { name, config } });
    } else {
      return await mongoDB()
        .collection("presets")
        .updateOne({ uid, _id: id }, { $set: { name } });
    }
  }

  static async removePreset(uid, id) {
    const preset = await mongoDB()
      .collection("presets")
      .findOne({ uid, _id: id });
    if (!preset) throw new MonkeyError(404, "Preset not found");
    return await mongoDB().collection("presets").remove({ uid, _id: id });
  }
}

module.exports = PresetDAO;
