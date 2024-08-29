import {
  AddPresetRequest,
  AddPresetResponse,
  DeletePresetsParams,
  GetPresetResponse,
} from "@monkeytype/contracts/presets";
import * as PresetDAL from "../../dal/preset";
import { MonkeyResponse2 } from "../../utils/monkey-response";
import { replaceObjectId } from "../../utils/misc";
import { Preset } from "@monkeytype/contracts/schemas/presets";

export async function getPresets(
  req: MonkeyTypes.Request2
): Promise<GetPresetResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = (await PresetDAL.getPresets(uid))
    .map((preset) => ({
      ...preset,
      uid: undefined,
    }))
    .map((it) => replaceObjectId(it));

  return new MonkeyResponse2("Presets retrieved", data);
}

export async function addPreset(
  req: MonkeyTypes.Request2<undefined, AddPresetRequest>
): Promise<AddPresetResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = await PresetDAL.addPreset(uid, req.body);

  return new MonkeyResponse2("Preset created", data);
}

export async function editPreset(
  req: MonkeyTypes.Request2<undefined, Preset>
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  await PresetDAL.editPreset(uid, req.body);

  return new MonkeyResponse2("Preset updated", null);
}

export async function removePreset(
  req: MonkeyTypes.Request2<undefined, undefined, DeletePresetsParams>
): Promise<MonkeyResponse2> {
  const { presetId } = req.params;
  const { uid } = req.ctx.decodedToken;

  await PresetDAL.removePreset(uid, presetId);

  return new MonkeyResponse2("Preset deleted", null);
}
