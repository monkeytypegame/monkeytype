import { PartialConfig } from "@monkeytype/contracts/schemas/configs";
import * as ConfigDAL from "../../dal/config";
import { MonkeyResponse2 } from "../../utils/monkey-response";
import { GetConfigResponse } from "@monkeytype/contracts/configs";

export async function getConfig(
  req: MonkeyTypes.Request2
): Promise<GetConfigResponse> {
  const { uid } = req.ctx.decodedToken;
  const data = (await ConfigDAL.getConfig(uid))?.config ?? null;

  return new MonkeyResponse2("Configuration retrieved", data);
}

export async function saveConfig(
  req: MonkeyTypes.Request2<undefined, PartialConfig>
): Promise<MonkeyResponse2> {
  const config = req.body;
  const { uid } = req.ctx.decodedToken;

  await ConfigDAL.saveConfig(uid, config);

  return new MonkeyResponse2("Config updated", null);
}

export async function deleteConfig(
  req: MonkeyTypes.Request2
): Promise<MonkeyResponse2> {
  const { uid } = req.ctx.decodedToken;

  await ConfigDAL.deleteConfig(uid);
  return new MonkeyResponse2("Config deleted", null);
}
