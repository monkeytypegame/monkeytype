import { ZodError } from "zod";

//from https://github.com/colinhacks/zod/pull/3819
export function isZodError(error: unknown): error is ZodError {
  if (!(error instanceof Error)) return false;

  if (error instanceof ZodError) return true;
  if (error.constructor.name === "ZodError") return true;
  if ("issues" in error && Array.isArray(error.issues)) return true;

  return false;
}
