import { expect } from "vitest";
import { z } from "zod";

expect.extend({
  toValidate(schema: z.ZodType, input: unknown) {
    const result = schema.safeParse(input);
    if (result.success) {
      return { pass: true, message: () => "" };
    }
    return {
      pass: false,
      message: () =>
        `expected input to be valid, got errors: ${JSON.stringify(result.error.issues.map((i) => i.message))}`,
    };
  },

  toReject(schema: z.ZodType, input: unknown, errorMessage?: string) {
    const result = schema.safeParse(input);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      if (errorMessage !== undefined) {
        const match = errors.some((e) => e.includes(errorMessage));
        if (match) {
          return { pass: true, message: () => "" };
        }
        return {
          pass: false,
          message: () =>
            `expected "${errorMessage}" in errors: ${JSON.stringify(errors)}`,
        };
      }
      return { pass: true, message: () => "" };
    }
    return {
      pass: false,
      message: () => `expected input to be invalid, but it passed validation`,
    };
  },
});
