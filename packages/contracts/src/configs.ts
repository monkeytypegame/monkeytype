import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithNullableData,
} from "./schemas/api";
import { PartialConfigSchema } from "./schemas/configs";

export const GetConfigResponseSchema =
  responseWithNullableData(PartialConfigSchema);

export type GetConfigResponse = z.infer<typeof GetConfigResponseSchema>;

const c = initContract();

export const configsContract = c.router(
  {
    get: {
      summary: "get config",
      description: "Get config of the current user.",
      method: "GET",
      path: "",
      responses: {
        200: GetConfigResponseSchema,
      },
    },
    save: {
      method: "PATCH",
      path: "",
      body: PartialConfigSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      summary: "update config",
      description:
        "Update the config of the current user. Only provided values will be updated while the missing values will be unchanged.",
    },
    delete: {
      method: "DELETE",
      path: "",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      summary: "delete config",
      description: "Delete/reset the config for the current user.",
    },
  },
  {
    pathPrefix: "/configs",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "configs",
    } as EndpointMetadata,

    commonResponses: CommonResponses,
  }
);
