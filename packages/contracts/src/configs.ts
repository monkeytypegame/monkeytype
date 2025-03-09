import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  meta,
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
      metadata: meta({
        rateLimit: "configGet",
      }),
    },
    save: {
      summary: "update config",
      description:
        "Update the config of the current user. Only provided values will be updated while the missing values will be unchanged.",
      method: "PATCH",
      path: "",
      body: PartialConfigSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "configUpdate",
      }),
    },
    delete: {
      summary: "delete config",
      description: "Delete/reset the config for the current user.",
      method: "DELETE",
      path: "",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "configDelete",
      }),
    },
  },
  {
    pathPrefix: "/configs",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "configs",
    }),

    commonResponses: CommonResponses,
  }
);
