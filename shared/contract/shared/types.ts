import { z } from "zod";

export const StringNumberSchema = z.custom<`${number}`>((val) => {
  return typeof val === "string" ? /^\d+$/.test(val) : false;
});
export type StringNumber = z.infer<typeof StringNumberSchema>;
