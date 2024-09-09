import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  meta,
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
      metadata: meta({
        authenticationOptions: {
          isPublic: true,
        },
      }),
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
      metadata: meta({
        authenticationOptions: {
          noCache: true,
          isPublicOnDev: true,
        },
        rateLimit: "adminLimit",
        requirePermission: "admin",
      }),
    },
    getSchema: {
      summary: "get configuration schema",
      description: "Get schema definition of the server configuration.",
      method: "GET",
      path: "/schema",
      responses: {
        200: ConfigurationSchemaResponseSchema,
      },
      metadata: meta({
        authenticationOptions: {
          isPublicOnDev: true,
          noCache: true,
        },
        rateLimit: "adminLimit",
        requirePermission: "admin",
      }),
    },
  },
  {
    pathPrefix: "/configuration",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "configuration",
    }),

    commonResponses: CommonResponses,
  }
);
