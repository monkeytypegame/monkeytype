import { initContract } from "@ts-rest/core";
import {
  CommonResponses,
  meta,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";
import { FriendSchema, FriendStatusSchema } from "./schemas/friends";
import { z } from "zod";
import { IdSchema } from "./schemas/util";

const c = initContract();

export const GetFriendsResponseSchema = responseWithData(z.array(FriendSchema));
export type GetFriendsResponse = z.infer<typeof GetFriendsResponseSchema>;

export const GetFriendsQuerySchema = z.object({
  status: z.array(FriendStatusSchema).optional(),
});
export type GetFriendsQuery = z.infer<typeof GetFriendsQuerySchema>;

export const CreateFriendRequestSchema = FriendSchema.pick({
  friendName: true,
}).strict();
export type CreateFriendRequest = z.infer<typeof CreateFriendRequestSchema>;

export const CreateFriendResponseSchema = responseWithData(FriendSchema);
export type CreateFriendResponse = z.infer<typeof CreateFriendResponseSchema>;

export const FriendIdPathParamsSchema = z.object({
  id: IdSchema,
});
export type FriendIdPathParams = z.infer<typeof FriendIdPathParamsSchema>;

export const friendsContract = c.router(
  {
    get: {
      summary: "Get friends",
      description: "Get friends of the current user",
      method: "GET",
      path: "",
      query: GetFriendsQuerySchema,
      responses: {
        200: GetFriendsResponseSchema,
      },
      metadata: meta({
        rateLimit: "friendsGet",
      }),
    },
    create: {
      summary: "Create friend",
      description: "Request a user to become a friend",
      method: "POST",
      path: "",
      body: CreateFriendRequestSchema,
      responses: {
        200: CreateFriendResponseSchema,
        404: MonkeyResponseSchema.describe("FriendUid unknown"),
        409: MonkeyResponseSchema.describe("Duplicate friend"),
      },
      metadata: meta({
        rateLimit: "friendsCreate",
      }),
    },
    delete: {
      summary: "Delete friend",
      description: "Remove a friend",
      method: "DELETE",
      path: "/:id",
      pathParams: FriendIdPathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        rateLimit: "friendsDelete",
      }),
    },
  },
  {
    pathPrefix: "/friends",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "friends",
      requireConfiguration: {
        path: "users.friends.enabled",
        invalidMessage: "Friends are not available at this time.",
      },
    }),
    commonResponses: CommonResponses,
  }
);
