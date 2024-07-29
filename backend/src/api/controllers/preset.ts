import {
  AddPresetRequest,
  GetPresetResponse,
} from "@monkeytype/contracts/presets";
import * as PresetDAL from "../../dal/preset";
import {
  MonkeyResponse,
  MonkeyResponse2,
  MonkeyResponse2NonNull,
} from "../../utils/monkey-response";
import { replaceObjectIds } from "../../utils/misc";

export async function getPresets(
  req: MonkeyTypes.Request2
): Promise<GetPresetResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = await PresetDAL.getPresets(uid);

  return new MonkeyResponse2NonNull("Preset retrieved", replaceObjectIds(data));
}

export async function addPreset(
  req: MonkeyTypes.Request2<undefined, AddPresetRequest>
): Promise<MonkeyResponse> {
  const { name, config } = req.body;
  const { uid } = req.ctx.decodedToken;

  const data = await PresetDAL.addPreset(uid, req.body);

  return new MonkeyResponse2("Preset created", data);
}

export async function editPreset(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { _id, name, config } = req.body;
  const { uid } = req.ctx.decodedToken;

  await PresetDAL.editPreset(uid, _id, name, config);

  return new MonkeyResponse("Preset updated");
}

export async function removePreset(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { presetId } = req.params;
  const { uid } = req.ctx.decodedToken;

  await PresetDAL.removePreset(uid, presetId as string);

  return new MonkeyResponse("Preset deleted");
}
