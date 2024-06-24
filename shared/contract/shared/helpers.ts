import { ZodSchema, ZodString, z } from "zod";
import { MonkeyResonseType, MonkeyResponseSchema } from "./types";

export const token = (): ZodString => z.string().regex(/^[a-zA-Z0-9_]+$/);

export function responseWithData<T extends ZodSchema>(
  dataSchema: T
): z.ZodObject<
  z.objectUtil.extendShape<
    typeof MonkeyResponseSchema.shape,
    {
      data: z.ZodNullable<T>;
    }
  >
> {
  return MonkeyResponseSchema.extend({
    data: dataSchema.nullable(),
  });
}
