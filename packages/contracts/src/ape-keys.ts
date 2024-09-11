import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  meta,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";

import { IdSchema } from "./schemas/util";
import {
  ApeKeySchema,
  ApeKeysSchema,
  ApeKeyUserDefinedSchema,
} from "./schemas/ape-keys";

export const GetApeKeyResponseSchema = responseWithData(ApeKeysSchema);
export type GetApeKeyResponse = z.infer<typeof GetApeKeyResponseSchema>;

export const AddApeKeyRequestSchema = ApeKeyUserDefinedSchema;
export type AddApeKeyRequest = z.infer<typeof AddApeKeyRequestSchema>;

export const AddApeKeyResponseSchema = responseWithData(
  z.object({
    apeKeyId: IdSchema,
    apeKey: z.string().base64(),
    apeKeyDetails: ApeKeySchema,
  })
);
export type AddApeKeyResponse = z.infer<typeof AddApeKeyResponseSchema>;

export const EditApeKeyRequestSchema = AddApeKeyRequestSchema.partial();
export type EditApeKeyRequest = z.infer<typeof EditApeKeyRequestSchema>;

export const ApeKeyParamsSchema = z.object({
  apeKeyId: IdSchema,
});
export type ApeKeyParams = z.infer<typeof ApeKeyParamsSchema>;

const c = initContract();

export const apeKeysContract = c.router(
  {
    get: {
      summary: "get ape keys",
      description: "Get ape keys of the current user.",
      method: "GET",
      path: "",
      responses: {
        200: GetApeKeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "apeKeysGet",
      }),
    },
    add: {
      summary: "add ape key",
      description: "Add an ape key for the current user.",
      method: "POST",
      path: "",
      body: AddApeKeyRequestSchema.strict(),
      responses: {
        200: AddApeKeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "apeKeysGenerate",
      }),
    },
    save: {
      summary: "update ape key",
      description: "Update an existing ape key for the current user.",
      method: "PATCH",
      path: "/:apeKeyId",
      pathParams: ApeKeyParamsSchema,
      body: EditApeKeyRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "apeKeysGenerate",
      }),
    },
    delete: {
      summary: "delete ape key",
      description: "Delete ape key by id.",
      method: "DELETE",
      path: "/:apeKeyId",
      pathParams: ApeKeyParamsSchema,
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "apeKeysGenerate",
      }),
    },
  },
  {
    pathPrefix: "/ape-keys",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "ape-keys",
      requirePermission: "canManageApeKeys",
      requireConfiguration: {
        path: "apeKeys.endpointsEnabled",
        invalidMessage: "ApeKeys are currently disabled.",
      },
    }),

    commonResponses: CommonResponses,
  }
);
