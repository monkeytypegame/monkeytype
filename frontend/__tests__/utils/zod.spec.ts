import { describe, it, expect } from "vitest";
import { z, ZodString, ZodNumber } from "zod";
import { unwrapSchema } from "../../src/ts/utils/zod";

describe("unwrapSchema", () => {
  it("unwraps optional", () => {
    const schema = z.string().optional();
    const unwrapped = unwrapSchema(schema);

    expect(unwrapped).toBeInstanceOf(ZodString);
  });

  it("unwraps default", () => {
    const schema = z.string().default("hello");
    const unwrapped = unwrapSchema(schema);

    expect(unwrapped).toBeInstanceOf(ZodString);
  });

  it("unwraps nullable", () => {
    const schema = z.number().nullable();
    const unwrapped = unwrapSchema(schema);

    expect(unwrapped).toBeInstanceOf(ZodNumber);
  });

  it("unwraps branded", () => {
    const schema = z.string().brand("UserId");
    const unwrapped = unwrapSchema(schema);

    expect(unwrapped).toBeInstanceOf(ZodString);
  });

  it("unwraps effects", () => {
    const schema = z.string().transform((v) => v.toUpperCase());
    const unwrapped = unwrapSchema(schema);

    expect(unwrapped).toBeInstanceOf(ZodString);
  });

  it("unwraps multiple nested wrappers", () => {
    const schema = z
      .string()
      .brand("X")
      .optional()
      .nullable()
      .default("test")
      .transform((v) => v);

    const unwrapped = unwrapSchema(schema);

    expect(unwrapped).toBeInstanceOf(ZodString);
  });

  it("returns the same schema if no wrappers exist", () => {
    const schema = z.string();
    const unwrapped = unwrapSchema(schema);

    expect(unwrapped).toBe(schema);
  });
});
