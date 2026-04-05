import { describe, expect, it } from "vitest";
import {
  buildSurfaceForms,
  isValidSurfaceForm,
} from "../../../src/ts/test/llm/surface-forms";

describe("llm surface forms", () => {
  describe("isValidSurfaceForm", () => {
    it("accepts plain words", () => {
      expect(isValidSurfaceForm("hello")).toBe(true);
      expect(isValidSurfaceForm("Bonjour")).toBe(true);
      expect(isValidSurfaceForm("cafe")).toBe(true);
    });

    it("accepts words with non-letter characters", () => {
      expect(isValidSurfaceForm("can't")).toBe(true);
      expect(isValidSurfaceForm("re-entry")).toBe(true);
      expect(isValidSurfaceForm("h3llo")).toBe(true);
      expect(isValidSurfaceForm("hello,")).toBe(true);
      expect(isValidSurfaceForm("__init__")).toBe(true);
      expect(isValidSurfaceForm("123")).toBe(true);
    });

    it("rejects empty strings and strings containing spaces", () => {
      expect(isValidSurfaceForm("")).toBe(false);
      expect(isValidSurfaceForm("two words")).toBe(false);
      expect(isValidSurfaceForm(" hello")).toBe(false);
      expect(isValidSurfaceForm("hello ")).toBe(false);
    });
  });

  describe("buildSurfaceForms", () => {
    it("filters space-containing entries and deduplicates", () => {
      expect(
        buildSurfaceForms([
          "hello",
          "hello",
          "two words",
          "world",
          "world!",
          "123",
          "re-entry",
        ]),
      ).toEqual(["hello", "world", "world!", "123", "re-entry"]);
    });
  });
});
