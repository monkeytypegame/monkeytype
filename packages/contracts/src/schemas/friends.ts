import { z } from "zod";
import { IdSchema } from "./util";

export const FriendRequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "blocked",
]);
export type FriendRequestStatus = z.infer<typeof FriendRequestStatusSchema>;

export const FriendRequestTypeSchema = z.enum(["incoming", "outgoing"]);
export type FriendRequestType = z.infer<typeof FriendRequestTypeSchema>;

export const FriendRequestSchema = z.object({
  _id: IdSchema,
  initiatorUid: IdSchema,
  initiatorName: z.string(),
  friendUid: IdSchema,
  friendName: z.string(),
  addedAt: z.number().int().nonnegative(),
  status: FriendRequestStatusSchema,
});

export type FriendRequest = z.infer<typeof FriendRequestSchema>;
