import { z } from "zod";
import { IdSchema } from "./util";
import { UserSchema } from "./users";
import { PersonalBestSchema } from "./shared";

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

export const FriendSchema = UserSchema.pick({
  uid: true,
  name: true,
  discordId: true,
  discordAvatar: true,
  startedTests: true,
  completedTests: true,
  timeTyping: true,
  xp: true,
  streak: true,
}).extend({
  addedAt: z.number().int().nonnegative().optional(),
  friendRequestId: IdSchema.optional(),
  top15: PersonalBestSchema.optional(),
  top60: PersonalBestSchema.optional(),
});

export type Friend = z.infer<typeof FriendSchema>;
