import { z } from "zod";
import { IdSchema } from "./util";

export const FriendStatusSchema = z.enum(["pending", "accepted", "rejected"]);
export type FriendStatus = z.infer<typeof FriendStatusSchema>;

export const FriendSchema = z.object({
  _id: IdSchema,
  initiatorUid: IdSchema,
  initiatorName: z.string(),
  friendUid: IdSchema,
  friendName: z.string(),
  addedAt: z.number().int().nonnegative(),
  status: FriendStatusSchema,
});

export type Friend = z.infer<typeof FriendSchema>;
