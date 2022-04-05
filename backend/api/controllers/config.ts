import ConfigDAO from "../../dao/config";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function getConfig(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const data = await ConfigDAO.getConfig(uid);
  return new MonkeyResponse("Configuration retrieved", data);
}

export async function saveConfig(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { config } = req.body;
  const { uid } = req.ctx.decodedToken;

  await ConfigDAO.saveConfig(uid, config);

  return new MonkeyResponse("Config updated");
}
