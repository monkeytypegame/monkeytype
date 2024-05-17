import MonkeyError from "../utils/error";
import * as db from "../init/db";
import { ObjectId, Filter, Collection, WithId } from "mongodb";

const MAX_PRESETS = 10;

type DBConfigPreset = MonkeyTypes.WithObjectId<SharedTypes.DBConfigPreset>;
type PresetCreationResult = { presetId: string };

const getPresetsCollection = (): Collection<WithId<DBConfigPreset>> => db.collection<DBConfigPreset>("presets");

const getPresetKeyFilter = (uid: string, keyId: string): Filter<DBConfigPreset> => ({ _id: new ObjectId(keyId), uid });

async function getPresets(uid: string): Promise<DBConfigPreset[]> {
  return await getPresetsCollection().find({ uid }).sort({ timestamp: -1 }).toArray();
}

async function addPreset(uid: string, name: string, config: SharedTypes.ConfigPreset): Promise<PresetCreationResult> {
  if ((await getPresets(uid)).length >= MAX_PRESETS) throw new MonkeyError(409, "Too many presets");

  const preset = await getPresetsCollection().insertOne({ _id: new ObjectId(), uid, name, config });
  return { presetId: preset.insertedId.toHexString() };
}

async function editPreset(uid: string, presetId: string, name: string, config: SharedTypes.ConfigPreset): Promise<void> {
  const presetUpdates = config && Object.keys(config).length ? { name, config } : { name };
  await getPresetsCollection().updateOne(getPresetKeyFilter(uid, presetId), { $set: presetUpdates });
}

async function removePreset(uid: string, presetId: string): Promise<void> {
  const deleteResult = await getPresetsCollection().deleteOne(getPresetKeyFilter(uid, presetId));
  if (!deleteResult.deletedCount) throw new MonkeyError(404, "Preset not found");
}

async function deleteAllPresets(uid: string): Promise<void> {
  await getPresetsCollection().deleteMany({ uid });
}

export { getPresets, addPreset, editPreset, removePreset, deleteAllPresets };
