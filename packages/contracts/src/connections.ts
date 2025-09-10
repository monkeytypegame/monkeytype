import { initContract } from "@ts-rest/core";

import {
  ConnectionSchema,
  ConnectionStatusSchema,
  ConnectionTypeSchema,
} from "@monkeytype/schemas/connections";
import { z } from "zod";
import {
  CommonResponses,
  meta,
  MonkeyResponseSchema,
  responseWithData,
} from "./util/api";
import { IdSchema } from "@monkeytype/schemas/util";

const c = initContract();

export const GetConnectionsResponseSchema = responseWithData(
  z.array(ConnectionSchema)
);
export type GetConnectionsResponse = z.infer<
  typeof GetConnectionsResponseSchema
>;

export const GetConnectionsQuerySchema = z.object({
  status: z
    .array(ConnectionStatusSchema)
    .or(ConnectionStatusSchema.transform((it) => [it]))
    .optional(),
  type: z
    .array(ConnectionTypeSchema)
    .or(ConnectionTypeSchema.transform((it) => [it]))
    .optional(),
});
export type GetConnectionsQuery = z.infer<typeof GetConnectionsQuerySchema>;

export const CreateConnectionRequestSchema = ConnectionSchema.pick({
  friendName: true,
});
export type CreateConnectionRequest = z.infer<
  typeof CreateConnectionRequestSchema
>;

export const CreateConnectionResponseSchema =
  responseWithData(ConnectionSchema);
export type CreateConnectionResponse = z.infer<
  typeof CreateConnectionResponseSchema
>;

export const IdPathParamsSchema = z.object({
  id: IdSchema,
});
export type IdPathParams = z.infer<typeof IdPathParamsSchema>;

export const UpdateConnectionRequestSchema = z.object({
  status: ConnectionStatusSchema.exclude(["pending"]),
});
export type UpdateConnectionRequest = z.infer<
  typeof UpdateConnectionRequestSchema
>;

export const connectionsContract = c.router(
  {
    get: {
      summary: "get connections",
      description: "Get connections of the current user",
      method: "GET",
      path: "/",
      query: GetConnectionsQuerySchema.strict(),
      responses: {
        200: GetConnectionsResponseSchema,
      },
      metadata: meta({
        rateLimit: "connectionGet",
      }),
    },
    create: {
      summary: "create connection",
      description: "Request a connection to a user ",
      method: "POST",
      path: "/",
      body: CreateConnectionRequestSchema.strict(),
      responses: {
        200: CreateConnectionResponseSchema,
        404: MonkeyResponseSchema.describe("FriendUid unknown"),
        409: MonkeyResponseSchema.describe(
          "Duplicate connection, blocked or max connections reached"
        ),
      },
      metadata: meta({
        rateLimit: "connectionCreate",
      }),
    },
    delete: {
      summary: "delete connection",
      description: "Delete a connection",
      method: "DELETE",
      path: "/:id",
      pathParams: IdPathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "connectionDelete",
      }),
    },
    update: {
      summary: "update connection",
      description: "Update a connection status",
      method: "PATCH",
      path: "/:id",
      pathParams: IdPathParamsSchema.strict(),
      body: UpdateConnectionRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "connectionUpdate",
      }),
    },
  },
  {
    pathPrefix: "/connections",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "connections",
      requireConfiguration: {
        path: "connections.enabled",
        invalidMessage: "Connections are not available at this time.",
      },
    }),
    commonResponses: CommonResponses,
  }
);
