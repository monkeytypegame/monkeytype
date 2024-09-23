import MonkeyError from "../utils/error";
import * as db from "../init/db";
import { ObjectId, type Filter, Collection, type WithId } from "mongodb";
import {
  EditPresetRequest,
  Preset,
} from "@monkeytype/contracts/schemas/presets";
import { omit } from "lodash";
import { WithObjectId } from "../utils/misc";

const MAX_PRESETS = 10;

type DBConfigPreset = WithObjectId<
  Preset & {
    uid: string;
  }
>;

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
  preset: Omit<Preset, "_id">
): Promise<PresetCreationResult> {
  const presets = await getPresetsCollection().countDocuments({ uid });

  if (presets >= MAX_PRESETS) {
    throw new MonkeyError(409, "Too many presets");
  }

  const result = await getPresetsCollection().insertOne({
    ...preset,
    _id: new ObjectId(),
    uid,
  });
  return {
    presetId: result.insertedId.toHexString(),
  };
}

export async function editPreset(
  uid: string,
  preset: EditPresetRequest
): Promise<void> {
  const update: Partial<Omit<Preset, "_id">> = omit(preset, "_id");
  if (
    preset.config === undefined ||
    preset.config === null ||
    Object.keys(preset.config).length === 0
  ) {
    delete update.config;
  }

  await getPresetsCollection().updateOne(getPresetKeyFilter(uid, preset._id), {
    $set: update,
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
