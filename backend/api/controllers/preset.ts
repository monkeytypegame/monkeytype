import PresetDAO from "../../dao/preset";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getPresets(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = await PresetDAO.getPresets(uid);
  return new MonkeyResponse("Preset retrieved", data);
}

export async function addPreset(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { name, config } = req.body;
  const { uid } = req.ctx.decodedToken;

  const data = await PresetDAO.addPreset(uid, name, config);

  return new MonkeyResponse("Preset created", data);
}

export async function editPreset(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { _id, name, config } = req.body;
  const { uid } = req.ctx.decodedToken;

  await PresetDAO.editPreset(uid, _id, name, config);

  return new MonkeyResponse("Preset updated");
}

export async function removePreset(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { presetId } = req.params;
  const { uid } = req.ctx.decodedToken;

  await PresetDAO.removePreset(uid, presetId);

  return new MonkeyResponse("Preset deleted");
}
