import { z } from "zod";

const StatusCodeSchema = z.number().int();
export type StatusCode = z.infer<typeof StatusCodeSchema>;

export const MonkeyResponseSchema = z.object({
  message: z.string(),
  status: StatusCodeSchema,
});
export type MonkeyResonseType = z.infer<typeof MonkeyResponseSchema>;

export const MonkeyValidationErrorSchema = MonkeyResponseSchema.extend({
  validationErrors: z.array(z.string()).nonempty(),
});
export type MonkeyValidationError = z.infer<typeof MonkeyValidationErrorSchema>;

export const MonkeyErrorSchema = MonkeyResponseSchema.extend({
  errorId: z.string(),
  uid: z.string().optional(),
});
export type MonkeyErrorType = z.infer<typeof MonkeyErrorSchema>;

export const MonkeyErrorResponseSchema = MonkeyErrorSchema.or(
  MonkeyValidationErrorSchema
);
