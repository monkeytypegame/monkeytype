import { PartialConfig } from "shared/contract/configs.contract";
import * as ConfigDAL from "../../dal/config";
import { MonkeyResponse2 } from "../../utils/monkey-response";

export async function getConfig(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2<PartialConfig>> {
  const { uid } = req.ctx.decodedToken;

  const data = await ConfigDAL.getConfig(uid);
  if (data === null) return new MonkeyResponse2("Configuration retrieved");
  return new MonkeyResponse2("Configuration retrieved", data.config);
}

export async function saveConfig(
  req: MonkeyTypes.Request2<undefined, PartialConfig>
): Promise<MonkeyResponse2<undefined>> {
  const config = req.body;
  const { uid } = req.ctx.decodedToken;

  await ConfigDAL.saveConfig(uid, config);

  return new MonkeyResponse2("Config updated");
}

export async function deleteConfig(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2<undefined>> {
  const { uid } = req.ctx.decodedToken;

  await ConfigDAL.deleteConfig(uid);
  return new MonkeyResponse2("Config deleted");
}
