import { z, ZodString } from "zod";

export const StringNumberSchema = z
  .string()
  .regex(
    /^\d+$/,
    'Needs to be a number or a number represented as a string e.g. "10".'
  )
  .or(z.number().transform(String));
export type StringNumber = z.infer<typeof StringNumberSchema>;

export const token = (): ZodString => z.string().regex(/^[a-zA-Z0-9_]+$/);

export const IdSchema = token();
export type Id = z.infer<typeof IdSchema>;

export const TagSchema = token().max(50);
export type Tag = z.infer<typeof TagSchema>;

export const LanguageSchema = z
  .string()
  .max(50)
  .regex(/^[a-zA-Z0-9_+]+$/, "Can only contain letters [a-zA-Z0-9_+]");
export type Language = z.infer<typeof LanguageSchema>;

export const NullableStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? undefined);
export type NullableString = z.infer<typeof NullableStringSchema>;

export const PercentageSchema = z.number().nonnegative().max(100);
export type Percentage = z.infer<typeof PercentageSchema>;

export const WpmSchema = z.number().nonnegative().max(420);
export type Wpm = z.infer<typeof WpmSchema>;

export const CustomTextModeSchema = z.enum(["repeat", "random", "shuffle"]);
export type CustomTextMode = z.infer<typeof CustomTextModeSchema>;

export const CustomTextLimitModeSchema = z.enum(["word", "time", "section"]);
export type CustomTextLimitMode = z.infer<typeof CustomTextLimitModeSchema>;
