import MonkeyError from "../utils/error";
import db from "../init/db";
import { ObjectId } from "mongodb";

class PresetDAO {
  static async getPresets(uid) {
    const preset = await db
      .collection("presets")
      .find({ uid })
      .sort({ timestamp: -1 })
      .toArray(); // this needs to be changed to later take patreon into consideration
    return preset;
  }

  static async addPreset(uid, name, config) {
    const count = await db.collection("presets").find({ uid }).count();
    if (count >= 10) throw new MonkeyError(409, "Too many presets");
    let preset = await db
      .collection("presets")
      .insertOne({ uid, name, config });
    return {
      insertedId: preset.insertedId,
    };
  }

  static async editPreset(uid, _id, name, config) {
    console.log(_id);
    const preset = await db
      .collection("presets")
      .findOne({ uid, _id: new ObjectId(_id) });
    if (!preset) throw new MonkeyError(404, "Preset not found");
    if (config) {
      return await db
        .collection("presets")
        .updateOne({ uid, _id: new ObjectId(_id) }, { $set: { name, config } });
    } else {
      return await db
        .collection("presets")
        .updateOne({ uid, _id: new ObjectId(_id) }, { $set: { name } });
    }
  }

  static async removePreset(uid, _id) {
    const preset = await db
      .collection("presets")
      .findOne({ uid, _id: new ObjectId(_id) });
    if (!preset) throw new MonkeyError(404, "Preset not found");
    return await db
      .collection("presets")
      .deleteOne({ uid, _id: new ObjectId(_id) });
  }
}

export default PresetDAO;
