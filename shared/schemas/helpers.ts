import { ZodSchema, ZodString, z } from "zod";
import { MonkeyResponseSchema } from "./util";

export const token = (): ZodString => z.string().regex(/^[a-zA-Z0-9_]+$/);

export function responseWithNullableData<T extends ZodSchema>(
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

export function responseWithData<T extends ZodSchema>(
  dataSchema: T
): z.ZodObject<
  z.objectUtil.extendShape<
    typeof MonkeyResponseSchema.shape,
    {
      data: T;
    }
  >
> {
  return MonkeyResponseSchema.extend({
    data: dataSchema,
  });
}
