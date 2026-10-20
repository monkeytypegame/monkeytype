// oxlint-disable typescript/consistent-type-definitions
import type { Assertion, AsymmetricMatchersContaining } from "vitest";

interface SchemaMachers<R extends z.ZodType> {
  toValidate(input: unknown): void;
  toReject(input: unknown, errorMessage?: string): void;
}

declare module "vitest" {
  // oxlint-disable-next-line typescript/no-empty-object-type
  interface Assertion<T = any> extends SchemaMachers<T> {}
}
