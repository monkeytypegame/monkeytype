import { z, ZodString } from "zod";

export const StringNumberSchema = z.custom<`${number}`>((val) => {
  return typeof val === "string" ? /^\d+$/.test(val) : false;
});

export type StringNumber = z.infer<typeof StringNumberSchema>;

export const token = (): ZodString => z.string().regex(/^[a-zA-Z0-9_]+$/);
