import { z } from "zod";

export const GetResultsQuerySchema = z.object({
  onOrAfterTimestamp: z.number().int().min(1589428800000).optional(),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().max(1000).optional(),
});
export type GetResultsQuery = z.infer<typeof GetResultsQuerySchema>;
