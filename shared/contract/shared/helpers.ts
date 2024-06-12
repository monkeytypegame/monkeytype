import { ZodString, z } from "zod";

/* eslint-disable  @typescript-eslint/explicit-function-return-type */
export const token = (): ZodString => z.string().regex(/^[a-zA-Z0-9_]+$/);
