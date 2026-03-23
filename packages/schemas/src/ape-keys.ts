import { z } from "zod";
import { IdSchema, SLUG_REGEX } from "./util";

export const ApeKeyNameSchema = z
  .string()
  .regex(SLUG_REGEX)
  .max(20);

export const ApeKeyUserDefinedSchema = z.object({
  name: ApeKeyNameSchema,
  enabled: z.boolean(),
});

export const ApeKeySchema = ApeKeyUserDefinedSchema.extend({
  createdOn: z.number().min(0),
  modifiedOn: z.number().min(0),
  lastUsedOn: z.number().min(0).or(z.literal(-1)),
});
export type ApeKey = z.infer<typeof ApeKeySchema>;

export const ApeKeysSchema = z.record(IdSchema, ApeKeySchema);
export type ApeKeys = z.infer<typeof ApeKeysSchema>;
