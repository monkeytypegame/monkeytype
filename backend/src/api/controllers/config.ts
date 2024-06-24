import {
  GetConfigResponse,
  PartialConfig,
} from "shared/contract/configs.contract";
import * as ConfigDAL from "../../dal/config";
import { MonkeyResponse2 } from "../../utils/monkey-response";

export async function getConfig(
  req: MonkeyTypes.Request2
): Promise<GetConfigResponse> {
  const { uid } = req.ctx.decodedToken;
  const data = (await ConfigDAL.getConfig(uid))?.config ?? null;

  return new MonkeyResponse2("Configuration retrieved", data);
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
  req: MonkeyTypes.Request2<undefined, unknown>
): Promise<MonkeyResponse2<undefined>> {
  const { uid } = req.ctx.decodedToken;

  await ConfigDAL.deleteConfig(uid);
  return new MonkeyResponse2("Config deleted");
}
