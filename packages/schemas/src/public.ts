import { z } from "zod";
import { StringNumberSchema } from "./util";

export const SpeedHistogramSchema = z.record(
  StringNumberSchema,
  z.number().int()
);
export type SpeedHistogram = z.infer<typeof SpeedHistogramSchema>;

export const TypingStatsSchema = z.object({
  timeTyping: z.number().nonnegative(),
  testsCompleted: z.number().int().nonnegative(),
  testsStarted: z.number().int().nonnegative(),
});
export type TypingStats = z.infer<typeof TypingStatsSchema>;
