import { z } from "zod";
import { IdSchema, TagSchema } from "./util";
import { PartialConfigSchema } from "./configs";

export const PresetNameSchema = z
  .string()
  .regex(/^[0-9a-zA-Z_-]+$/)
  .max(16);
export type PresentName = z.infer<typeof PresetNameSchema>;

export const PresetSchema = z.object({
  _id: IdSchema,
  name: PresetNameSchema,
  config: PartialConfigSchema.extend({
    tags: z.array(TagSchema).optional(),
  }),
});
export type Preset = z.infer<typeof PresetSchema>;
