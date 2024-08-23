import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";
import { ConfigurationSchema } from "./schemas/configuration";

export const GetConfigurationResponseSchema =
  responseWithData(ConfigurationSchema);

export type GetConfigurationResponse = z.infer<
  typeof GetConfigurationResponseSchema
>;

export const PartialConfigurationSchema = ConfigurationSchema.deepPartial();
export type PartialConfiguration = z.infer<typeof PartialConfigurationSchema>;

export const PatchConfigurationRequestSchema = z
  .object({
    configuration: PartialConfigurationSchema.strict(),
  })
  .strict();
export type PatchConfigurationRequest = z.infer<
  typeof PatchConfigurationRequestSchema
>;

export const ConfigurationSchemaResponseSchema = responseWithData(z.object({})); //TODO define schema?
export type ConfigurationSchemaResponse = z.infer<
  typeof ConfigurationSchemaResponseSchema
>;

const c = initContract();

export const configurationContract = c.router(
  {
    get: {
      summary: "get configuration",
      description: "Get server configuration",
      method: "GET",
      path: "",
      responses: {
        200: GetConfigurationResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          isPublic: true,
        },
      } as EndpointMetadata,
    },
    update: {
      summary: "update configuration",
      description:
        "Update the server configuration. Only provided values will be updated while the missing values will be unchanged.",
      method: "PATCH",
      path: "",
      body: PatchConfigurationRequestSchema,
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          noCache: true,
          isPublicOnDev: true,
        },
      } as EndpointMetadata,
    },
    getSchema: {
      summary: "get configuration schema",
      description: "Get schema definition of the server configuration.",
      method: "GET",
      path: "/schema",
      responses: {
        200: ConfigurationSchemaResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          isPublicOnDev: true,
          noCache: true,
        },
      } as EndpointMetadata,
    },
  },
  {
    pathPrefix: "/configuration",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "configurations",
    } as EndpointMetadata,

    commonResponses: CommonResponses,
  }
);
