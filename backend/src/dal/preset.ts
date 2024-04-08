import MonkeyError from "../utils/error";
import * as db from "../init/db";
import { ObjectId, Filter, Collection, WithId } from "mongodb";

const MAX_PRESETS = 10;

type DBConfigPreset = MonkeyTypes.WithObjectId<SharedTypes.DBConfigPreset>;

function getPresetKeyFilter(
  uid: string,
  keyId: string
): Filter<DBConfigPreset> {
  return {
    _id: new ObjectId(keyId),
    uid,
  };
}

type PresetCreationResult = {
  presetId: string;
};

export const getPresetsCollection = (): Collection<WithId<DBConfigPreset>> =>
  db.collection<DBConfigPreset>("presets");

export async function getPresets(uid: string): Promise<DBConfigPreset[]> {
  const presets = await getPresetsCollection()
    .find({ uid })
    .sort({ timestamp: -1 })
    .toArray(); // this needs to be changed to later take patreon into consideration
  return presets;
}

export async function addPreset(
  uid: string,
  name: string,
  config: SharedTypes.ConfigPreset
): Promise<PresetCreationResult> {
  const presets = await getPresets(uid);
  if (presets.length >= MAX_PRESETS) {
    throw new MonkeyError(409, "Too many presets");
  }

  const preset = await getPresetsCollection().insertOne({
    _id: new ObjectId(),
    uid,
    name,
    config,
  });
  return {
    presetId: preset.insertedId.toHexString(),
  };
}

export async function editPreset(
  uid: string,
  presetId: string,
  name: string,
  config: SharedTypes.ConfigPreset
): Promise<void> {
  const presetUpdates =
    config !== undefined && config !== null && Object.keys(config).length > 0
      ? { name, config }
      : { name };
  await getPresetsCollection().updateOne(getPresetKeyFilter(uid, presetId), {
    $set: presetUpdates,
  });
}

export async function removePreset(
  uid: string,
  presetId: string
): Promise<void> {
  const deleteResult = await getPresetsCollection().deleteOne(
    getPresetKeyFilter(uid, presetId)
  );

  if (deleteResult.deletedCount === 0) {
    throw new MonkeyError(404, "Preset not found");
  }
}

export async function deleteAllPresets(uid: string): Promise<void> {
  await getPresetsCollection().deleteMany({ uid });
}
