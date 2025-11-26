import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { ConfigurationSchema } from "@monkeytype/schemas/configuration";
import {
  CommonResponses,
  meta,
  MonkeyResponseSchema,
  responseWithData,
} from "./util/api";

export const GetConfigurationResponseSchema =
  responseWithData(ConfigurationSchema);

export type GetConfigurationResponse = z.infer<
  typeof GetConfigurationResponseSchema
>;

// marked as deprecated but zod team might reconsider according to https://github.com/colinhacks/zod/issues/2854#issuecomment-3100623150
// eslint-disable-next-line @typescript-eslint/no-deprecated
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
  },
);
