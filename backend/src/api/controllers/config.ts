import { PartialConfig } from "@monkeytype/contracts/schemas/configs";
import * as ConfigDAL from "../../dal/config";
import { MonkeyResponse } from "../../utils/monkey-response";
import { GetConfigResponse } from "@monkeytype/contracts/configs";

export async function getConfig(
  req: MonkeyTypes.Request
): Promise<GetConfigResponse> {
  const { uid } = req.ctx.decodedToken;
  const data = (await ConfigDAL.getConfig(uid))?.config ?? null;

  return new MonkeyResponse("Configuration retrieved", data);
}

export async function saveConfig(
  req: MonkeyTypes.Request<undefined, PartialConfig>
): Promise<MonkeyResponse> {
  const config = req.body;
  const { uid } = req.ctx.decodedToken;

  await ConfigDAL.saveConfig(uid, config);

  return new MonkeyResponse("Config updated", null);
}

export async function deleteConfig(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  await ConfigDAL.deleteConfig(uid);
  return new MonkeyResponse("Config deleted", null);
}
