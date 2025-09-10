import { z } from "zod";
import { IdSchema } from "./util";

export const ConnectionStatusSchema = z.enum([
  "pending",
  "accepted",
  "blocked",
]);
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

export const ConnectionTypeSchema = z.enum(["incoming", "outgoing"]);
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>;

export const ConnectionSchema = z.object({
  _id: IdSchema,
  initiatorUid: IdSchema,
  initiatorName: z.string(),
  friendUid: IdSchema,
  friendName: z.string(),
  addedAt: z.number().int().nonnegative(),
  status: ConnectionStatusSchema,
});

export type Connection = z.infer<typeof ConnectionSchema>;
