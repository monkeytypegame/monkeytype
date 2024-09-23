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
import { MonkeyRequest } from "../types";

export async function getPresets(
  req: MonkeyRequest
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
  req: MonkeyRequest<undefined, AddPresetRequest>
): Promise<AddPresetResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = await PresetDAL.addPreset(uid, req.body);

  return new MonkeyResponse("Preset created", data);
}

export async function editPreset(
  req: MonkeyRequest<undefined, EditPresetRequest>
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  await PresetDAL.editPreset(uid, req.body);

  return new MonkeyResponse("Preset updated", null);
}

export async function removePreset(
  req: MonkeyRequest<undefined, undefined, DeletePresetsParams>
): Promise<MonkeyResponse> {
  const { presetId } = req.params;
  const { uid } = req.ctx.decodedToken;

  await PresetDAL.removePreset(uid, presetId);

  return new MonkeyResponse("Preset deleted", null);
}
