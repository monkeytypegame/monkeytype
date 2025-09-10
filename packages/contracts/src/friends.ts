import { initContract } from "@ts-rest/core";

import {
  FriendRequestSchema,
  FriendRequestStatusSchema,
  FriendRequestTypeSchema,
} from "@monkeytype/schemas/friends";
import { z } from "zod";
import {
  CommonResponses,
  meta,
  MonkeyResponseSchema,
  responseWithData,
} from "./util/api";
import { IdSchema } from "@monkeytype/schemas/util";

const c = initContract();

export const GetFriendRequestsResponseSchema = responseWithData(
  z.array(FriendRequestSchema)
);
export type GetFriendRequestsResponse = z.infer<
  typeof GetFriendRequestsResponseSchema
>;

export const GetFriendRequestsQuerySchema = z.object({
  status: z
    .array(FriendRequestStatusSchema)
    .or(FriendRequestStatusSchema.transform((it) => [it]))
    .optional(),
  type: z
    .array(FriendRequestTypeSchema)
    .or(FriendRequestTypeSchema.transform((it) => [it]))
    .optional(),
});
export type GetFriendRequestsQuery = z.infer<
  typeof GetFriendRequestsQuerySchema
>;

export const CreateFriendRequestRequestSchema = FriendRequestSchema.pick({
  friendName: true,
});
export type CreateFriendRequestRequest = z.infer<
  typeof CreateFriendRequestRequestSchema
>;

export const CreateFriendRequestResponseSchema =
  responseWithData(FriendRequestSchema);
export type CreateFriendRequestResponse = z.infer<
  typeof CreateFriendRequestResponseSchema
>;

export const IdPathParamsSchema = z.object({
  id: IdSchema,
});
export type IdPathParams = z.infer<typeof IdPathParamsSchema>;

export const UpdateFriendRequestsRequestSchema = z.object({
  status: FriendRequestStatusSchema.exclude(["pending"]),
});
export type UpdateFriendRequestsRequest = z.infer<
  typeof UpdateFriendRequestsRequestSchema
>;

export const friendsContract = c.router(
  {
    getRequests: {
      summary: "get friend requests",
      description: "Get friend requests of the current user",
      method: "GET",
      path: "/requests",
      query: GetFriendRequestsQuerySchema.strict(),
      responses: {
        200: GetFriendRequestsResponseSchema,
      },
      metadata: meta({
        rateLimit: "friendRequestsGet",
      }),
    },
    createRequest: {
      summary: "create friend request",
      description: "Request a user to become a friend",
      method: "POST",
      path: "/requests",
      body: CreateFriendRequestRequestSchema.strict(),
      responses: {
        200: CreateFriendRequestResponseSchema,
        404: MonkeyResponseSchema.describe("FriendUid unknown"),
        409: MonkeyResponseSchema.describe(
          "Duplicate friend, blocked or max friends reached"
        ),
      },
      metadata: meta({
        rateLimit: "friendRequestsCreate",
      }),
    },
    deleteRequest: {
      summary: "delete friend request",
      description: "Delete a friend request",
      method: "DELETE",
      path: "/requests/:id",
      pathParams: IdPathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "friendRequestsDelete",
      }),
    },
    updateRequest: {
      summary: "update friend request",
      description: "Update a friend request status",
      method: "PATCH",
      path: "/requests/:id",
      pathParams: IdPathParamsSchema.strict(),
      body: UpdateFriendRequestsRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "friendRequestsUpdate",
      }),
    },
  },
  {
    pathPrefix: "/friends",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "friends",
      requireConfiguration: {
        path: "connections.enabled",
        invalidMessage: "Friends are not available at this time.",
      },
    }),
    commonResponses: CommonResponses,
  }
);
