import * as Configuration from "../../init/configuration";
import { MonkeyResponse } from "../../utils/monkey-response";
import { CONFIGURATION_FORM_SCHEMA } from "../../constants/base-configuration";
import {
  ConfigurationSchemaResponse,
  GetConfigurationResponse,
  PatchConfigurationRequest,
} from "@monkeytype/contracts/configuration";
import MonkeyError from "../../utils/error";
import { MonkeyRequest } from "../types";

export async function getConfiguration(
  _req: MonkeyRequest
): Promise<GetConfigurationResponse> {
  const currentConfiguration = await Configuration.getLiveConfiguration();
  return new MonkeyResponse("Configuration retrieved", currentConfiguration);
}

export async function getSchema(
  _req: MonkeyRequest
): Promise<ConfigurationSchemaResponse> {
  return new MonkeyResponse(
    "Configuration schema retrieved",
    CONFIGURATION_FORM_SCHEMA
  );
}

export async function updateConfiguration(
  req: MonkeyRequest<undefined, PatchConfigurationRequest>
): Promise<MonkeyResponse> {
  const { configuration } = req.body;
  const success = await Configuration.patchConfiguration(configuration);

  if (!success) {
    throw new MonkeyError(500, "Configuration update failed");
  }

  return new MonkeyResponse("Configuration updated", null);
}
