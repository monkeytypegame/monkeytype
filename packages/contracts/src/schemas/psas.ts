import { z } from "zod";
import { IdSchema } from "./util";

export const PSASchema = z.object({
  _id: IdSchema,
  message: z.string(),
  date: z.number().int().min(0).optional(),
  level: z.number().int().optional(),
  sticky: z.boolean().optional(),
});
export type PSA = z.infer<typeof PSASchema>;
