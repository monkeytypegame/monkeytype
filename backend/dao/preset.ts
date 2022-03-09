import MonkeyError from "../utils/error";
import db from "../init/db";
import { ObjectId, Filter } from "mongodb";

const MAX_PRESETS = 10;
const COLLECTION_NAME = "presets";

function getPresetKeyFilter(uid: string, keyId: string): Filter<any> {
  return {
    _id: new ObjectId(keyId),
    uid,
  };
}

interface PresetCreationResult {
  presetId: string;
}

class PresetDAO {
  // TODO: Add typings for presets/configs, must look into shared type declarations.
  static async getPresets(uid: string): Promise<any[]> {
    const presets = await db
      .collection(COLLECTION_NAME)
      .find({ uid })
      .sort({ timestamp: -1 })
      .toArray(); // this needs to be changed to later take patreon into consideration
    return presets;
  }

  static async addPreset(
    uid: string,
    name: string,
    config: any
  ): Promise<PresetCreationResult> {
    const presets = await this.getPresets(uid);
    if (presets.length >= MAX_PRESETS) {
      throw new MonkeyError(409, "Too many presets");
    }

    const preset = await db
      .collection(COLLECTION_NAME)
      .insertOne({ uid, name, config } as any);
    return {
      presetId: preset.insertedId.toHexString(),
    };
  }

  static async editPreset(
    uid: string,
    presetId: string,
    name: string,
    config: any
  ): Promise<void> {
    const presetUpdates = config ? { name, config } : { name };
    const updateResult = await db
      .collection(COLLECTION_NAME)
      .updateOne(getPresetKeyFilter(uid, presetId), { $set: presetUpdates });

    if (updateResult.modifiedCount === 0) {
      throw new MonkeyError(404, "Preset not found");
    }
  }

  static async removePreset(uid: string, presetId: string): Promise<void> {
    const deleteResult = await db
      .collection(COLLECTION_NAME)
      .deleteOne(getPresetKeyFilter(uid, presetId));

    if (deleteResult.deletedCount === 0) {
      throw new MonkeyError(404, "Preset not found");
    }
  }
}

export default PresetDAO;
