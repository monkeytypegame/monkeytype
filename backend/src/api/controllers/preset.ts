import {
  AddPresetRequest,
  AddPresetResponse,
  DeletePresetsParams,
  GetPresetResponse,
} from "@monkeytype/contracts/presets";
import * as PresetDAL from "../../dal/preset";
import { MonkeyResponse } from "../../utils/monkey-response";
import { replaceObjectId } from "../../utils/misc";
import { EditPresetRequest } from "@monkeytype/contracts/schemas/presets";

export async function getPresets(
  req: MonkeyTypes.Request
): Promise<GetPresetResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = (await PresetDAL.getPresets(uid))
    .map((preset) => ({
      ...preset,
      uid: undefined,
    }))
    .map((it) => replaceObjectId(it));

  return new MonkeyResponse("Presets retrieved", data);
}

export async function addPreset(
  req: MonkeyTypes.Request<undefined, AddPresetRequest>
): Promise<AddPresetResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = await PresetDAL.addPreset(uid, req.body);

  return new MonkeyResponse("Preset created", data);
}

export async function editPreset(
  req: MonkeyTypes.Request<undefined, EditPresetRequest>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  await PresetDAL.editPreset(uid, req.body);

  return new MonkeyResponse("Preset updated", null);
}

export async function removePreset(
  req: MonkeyTypes.Request<undefined, undefined, DeletePresetsParams>
): Promise<MonkeyResponse> {
  const { presetId } = req.params;
  const { uid } = req.ctx.decodedToken;

  await PresetDAL.removePreset(uid, presetId);

  return new MonkeyResponse("Preset deleted", null);
}
