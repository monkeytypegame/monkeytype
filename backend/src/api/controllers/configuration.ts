import * as Configuration from "../../init/configuration";
import { MonkeyResponse, MonkeyResponse2 } from "../../utils/monkey-response";
import { CONFIGURATION_FORM_SCHEMA } from "../../constants/base-configuration";
import {
  ConfigurationSchemaResponse,
  GetConfigurationResponse,
  PatchConfigurationRequest,
} from "@monkeytype/contracts/configurations";

export async function getConfiguration(
  _req: MonkeyTypes.Request2
): Promise<GetConfigurationResponse> {
  const currentConfiguration = await Configuration.getLiveConfiguration();
  return new MonkeyResponse2("Configuration retrieved", currentConfiguration);
}

export async function getSchema(
  _req: MonkeyTypes.Request2
): Promise<ConfigurationSchemaResponse> {
  return new MonkeyResponse2(
    "Configuration schema retrieved",
    CONFIGURATION_FORM_SCHEMA
  );
}

export async function updateConfiguration(
  req: MonkeyTypes.Request2<undefined, PatchConfigurationRequest>
): Promise<MonkeyResponse2> {
  const { configuration } = req.body;
  const success = await Configuration.patchConfiguration(configuration);

  if (!success) {
    return new MonkeyResponse("Configuration update failed", {}, 500);
  }

  return new MonkeyResponse2("Configuration updated", null);
}
