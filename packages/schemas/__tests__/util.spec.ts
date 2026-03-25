import { describe, it, expect } from "vitest";
import { nameWithSeparators, slug } from "../src/util";

describe("Schema Validation Tests", () => {
  describe("nameWithSeparators", () => {
    const schema = nameWithSeparators();

    it("accepts valid names", () => {
      expect(schema.safeParse("valid_name").success).toBe(true);
      expect(schema.safeParse("valid-name").success).toBe(true);
      expect(schema.safeParse("valid123").success).toBe(true);
      expect(schema.safeParse("Valid_Name-Check").success).toBe(true);
    });

    it("rejects leading/trailing separators", () => {
      expect(schema.safeParse("_invalid").success).toBe(false);
      expect(schema.safeParse("invalid-").success).toBe(false);
    });

    it("rejects consecutive separators", () => {
      expect(schema.safeParse("inv__alid").success).toBe(false);
      expect(schema.safeParse("inv--alid").success).toBe(false);
      expect(schema.safeParse("inv-_alid").success).toBe(false);
    });

    it("rejects dots", () => {
      expect(schema.safeParse("invalid.dot").success).toBe(false);
      expect(schema.safeParse(".invalid").success).toBe(false);
    });
  });

  describe("slug", () => {
    const schema = slug();

    it("accepts valid slugs", () => {
      expect(schema.safeParse("valid-slug.123_test").success).toBe(true);
      expect(schema.safeParse("valid.dots").success).toBe(true);
      expect(schema.safeParse("_leading_underscore_is_fine").success).toBe(
        true,
      );
      expect(schema.safeParse("-leading_hyphen_is_fine").success).toBe(true);
      expect(schema.safeParse("trailing_is_fine_in_slug_").success).toBe(true);
    });

    it("rejects leading dots", () => {
      expect(schema.safeParse(".invalid").success).toBe(false);
    });

    it("rejects invalid characters", () => {
      expect(schema.safeParse("invalid,comma").success).toBe(false);
      expect(schema.safeParse(",invalid").success).toBe(false);
      expect(schema.safeParse("invalid space").success).toBe(false);
      expect(schema.safeParse("invalid#hash").success).toBe(false);
    });
  });
});
