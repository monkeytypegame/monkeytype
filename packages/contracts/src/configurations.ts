import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithNullableData,
} from "./schemas/api";
import { ConfigurationSchema } from "./schemas/configurations";

export const GetConfigurationResponseSchema =
  responseWithNullableData(ConfigurationSchema);

export type GetConfigurationResponse = z.infer<
  typeof GetConfigurationResponseSchema
>;

export const PatchConfigurationRequestSchema =
  ConfigurationSchema.partial().strict();
export type PatchConfigurationRequest = z.infer<
  typeof PatchConfigurationRequestSchema
>;

const c = initContract();

export const configurationsContract = c.router(
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
          publicOnDev: true,
          noCache: true,
        },
      } as EndpointMetadata,
    },
    getSchema: {
      summary: "get configuration schema",
      description: "Get schema definition of the server configuration.",
      method: "GET",
      path: "/schema",
      responses: {
        200: z.object({}), //any object for now
      },
      metadata: {
        authenticationOptions: {
          publicOnDev: true,
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
