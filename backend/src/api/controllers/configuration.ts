import * as Configuration from "../../init/configuration";
import { MonkeyResponse } from "../../utils/monkey-response";
import { CONFIGURATION_FORM_SCHEMA } from "../../constants/base-configuration";

export async function getConfiguration(
  _req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const currentConfiguration = await Configuration.getLiveConfiguration();
  return new MonkeyResponse("Configuration retrieved", currentConfiguration);
}

export async function getSchema(
  _req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  return new MonkeyResponse(
    "Configuration schema retrieved",
    CONFIGURATION_FORM_SCHEMA
  );
}

export async function updateConfiguration(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { configuration } = req.body;
  const success = await Configuration.patchConfiguration(configuration);

  if (!success) {
    return new MonkeyResponse("Configuration update failed", {}, 500);
  }

  return new MonkeyResponse("Configuration updated");
}
