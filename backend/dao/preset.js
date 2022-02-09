import MonkeyError from "../handlers/error";
import { mongoDB } from "../init/mongodb";

import Mongo from "mongodb";

const { ObjectID } = Mongo;

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
    let preset = await mongoDB()
      .collection("presets")
      .insertOne({ uid, name, config });
    return {
      insertedId: preset.insertedId,
    };
  }

  static async editPreset(uid, _id, name, config) {
    console.log(_id);
    const preset = await mongoDB()
      .collection("presets")
      .findOne({ uid, _id: ObjectID(_id) });
    if (!preset) throw new MonkeyError(404, "Preset not found");
    if (config) {
      return await mongoDB()
        .collection("presets")
        .updateOne({ uid, _id: ObjectID(_id) }, { $set: { name, config } });
    } else {
      return await mongoDB()
        .collection("presets")
        .updateOne({ uid, _id: ObjectID(_id) }, { $set: { name } });
    }
  }

  static async removePreset(uid, _id) {
    const preset = await mongoDB()
      .collection("presets")
      .findOne({ uid, _id: ObjectID(_id) });
    if (!preset) throw new MonkeyError(404, "Preset not found");
    return await mongoDB()
      .collection("presets")
      .deleteOne({ uid, _id: ObjectID(_id) });
  }
}

export default PresetDAO;
