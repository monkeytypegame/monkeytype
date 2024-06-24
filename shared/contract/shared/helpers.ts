import { ZodSchema, ZodString, z } from "zod";
import { MonkeyResponseSchema } from "./types";

export const token = (): ZodString => z.string().regex(/^[a-zA-Z0-9_]+$/);

export const responseWithData = (dataSchema: ZodSchema): ZodSchema =>
  MonkeyResponseSchema.extend({ data: dataSchema.nullable() });
