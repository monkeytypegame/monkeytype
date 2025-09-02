import { z } from "zod";
import { IdSchema } from "./util";

export const ApeKeyUserDefinedSchema = z.object({
  name: z
    .string()
    .regex(/^[0-9a-zA-Z_.-]+$/)
    .max(20),
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
