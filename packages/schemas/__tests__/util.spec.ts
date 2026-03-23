import { describe, it, expect } from "vitest";
import { nameWithUnderscores, slug } from "../src/util";

describe("Schema Validation Tests", () => {
  describe("nameWithUnderscores", () => {
    const schema = nameWithUnderscores();

    it("accepts valid names", () => {
      expect(schema.safeParse("valid_name").success).toBe(true);
      expect(schema.safeParse("valid123").success).toBe(true);
      expect(schema.safeParse("Valid_Name_Check").success).toBe(true);
    });

    it("rejects leading/trailing underscores", () => {
      expect(schema.safeParse("_invalid").success).toBe(false);
      expect(schema.safeParse("invalid_").success).toBe(false);
    });

    it("rejects consecutive underscores", () => {
      expect(schema.safeParse("inv__alid").success).toBe(false);
    });

    it("rejects non-underscore separators", () => {
      expect(schema.safeParse("invalid-name").success).toBe(false);
    });
  });

  describe("slug", () => {
    const schema = slug();

    it("accepts valid slugs", () => {
      expect(schema.safeParse("valid-slug.123_test").success).toBe(true);
      expect(schema.safeParse("valid.dots").success).toBe(true);
      expect(schema.safeParse("_leading_is_fine_in_slug").success).toBe(true);
      expect(schema.safeParse("trailing_is_fine_in_slug_").success).toBe(true);
    });
  });
});
