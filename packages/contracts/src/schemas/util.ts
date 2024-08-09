import { z, ZodString } from "zod";

export const StringNumberSchema = z

  .custom<`${number}`>((val) => {
    if (typeof val === "number") val = val.toString();
    return typeof val === "string" ? /^\d+$/.test(val) : false;
  }, 'Needs to be a number or a number represented as a string e.g. "10".')
  .transform(String);

export type StringNumber = z.infer<typeof StringNumberSchema>;

export const token = (): ZodString => z.string().regex(/^[a-zA-Z0-9_]+$/);

export const IdSchema = token();
export type Id = z.infer<typeof IdSchema>;

export const TagSchema = token().max(50);
export type Tag = z.infer<typeof TagSchema>;

export const LanguageSchema = z
  .string()
  .max(50)
  .regex(/^[a-zA-Z0-9_+]+$/);
export type Language = z.infer<typeof LanguageSchema>;
