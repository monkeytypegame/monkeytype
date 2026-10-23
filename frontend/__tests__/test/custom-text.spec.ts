import { describe, it, expect, beforeEach, vi } from "vitest";
import type * as CustomTextModule from "../../src/ts/test/custom-text";

describe("test/custom-text.ts", () => {
  let CustomText: typeof CustomTextModule;

  // The module holds module-level LocalStorageWithSchema instances with
  // in-memory caches, so re-import the module for a clean state per test.
  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    CustomText = await import("../../src/ts/test/custom-text");
  });

  describe("setCustomText / getCustomText", () => {
    it("should store and retrieve short custom text", () => {
      expect(CustomText.setCustomText("foo", "hello world")).toBe(true);
      expect(CustomText.getCustomText("foo")).toStrictEqual(["hello", "world"]);
    });

    it("should join string arrays into a single text", () => {
      CustomText.setCustomText("foo", ["a", "b", "c"]);
      expect(CustomText.getCustomText("foo")).toStrictEqual(["a", "b", "c"]);
    });

    it("should store short custom text with the unified object structure", () => {
      CustomText.setCustomText("foo", "hello world");
      expect(
        JSON.parse(localStorage.getItem("customText") ?? "null"),
      ).toStrictEqual({ foo: { text: "hello world" } });
    });

    it("should store long custom text with initial progress 0", () => {
      expect(CustomText.setCustomText("bar", "long text", true)).toBe(true);
      expect(CustomText.getCustomText("bar", true)).toStrictEqual([
        "long",
        "text",
      ]);
      expect(
        JSON.parse(localStorage.getItem("customTextLong") ?? "null"),
      ).toStrictEqual({ bar: { text: "long text", progress: 0 } });
    });

    it("should store short and long custom texts separately", () => {
      CustomText.setCustomText("same", "short text");
      CustomText.setCustomText("same", "long text", true);

      expect(CustomText.getCustomText("same")).toStrictEqual(["short", "text"]);
      expect(CustomText.getCustomText("same", true)).toStrictEqual([
        "long",
        "text",
      ]);
      expect(CustomText.getCustomTextNames(false)).toStrictEqual(["same"]);
      expect(CustomText.getCustomTextNames(true)).toStrictEqual(["same"]);
    });

    it("should throw when getting a custom text that does not exist", () => {
      expect(() => CustomText.getCustomText("missing")).toThrow(
        "Custom text missing not found",
      );
      expect(() => CustomText.getCustomText("missing", true)).toThrow(
        "Custom text missing not found",
      );
    });
  });

  describe("long custom text progress", () => {
    it("should default progress to 0", () => {
      CustomText.setCustomText("bar", "long text", true);
      expect(CustomText.getCustomTextLongProgress("bar")).toBe(0);
    });

    it("should update and persist progress", () => {
      CustomText.setCustomText("bar", "a b c d", true);
      CustomText.setCustomTextLongProgress("bar", 2);
      expect(CustomText.getCustomTextLongProgress("bar")).toBe(2);
      expect(
        JSON.parse(localStorage.getItem("customTextLong") ?? "null"),
      ).toStrictEqual({ bar: { text: "a b c d", progress: 2 } });
    });

    it("should read progress back from localStorage", async () => {
      localStorage.setItem(
        "customTextLong",
        JSON.stringify({ bar: { text: "a b c", progress: 7 } }),
      );
      vi.resetModules();
      CustomText = await import("../../src/ts/test/custom-text");

      expect(CustomText.getCustomTextLongProgress("bar")).toBe(7);
    });

    it("should throw when the custom text does not exist", () => {
      expect(() => CustomText.getCustomTextLongProgress("missing")).toThrow(
        "Custom text not found",
      );
      expect(() => CustomText.setCustomTextLongProgress("missing", 1)).toThrow(
        "Custom text not found",
      );
    });
  });

  describe("deleteCustomText / getCustomTextNames", () => {
    it("should delete short custom text", () => {
      CustomText.setCustomText("foo", "hello");
      CustomText.deleteCustomText("foo", false);
      expect(CustomText.getCustomTextNames(false)).toStrictEqual([]);
      expect(() => CustomText.getCustomText("foo")).toThrow(
        "Custom text foo not found",
      );
    });

    it("should delete long custom text", () => {
      CustomText.setCustomText("bar", "hello", true);
      CustomText.deleteCustomText("bar", true);
      expect(CustomText.getCustomTextNames(true)).toStrictEqual([]);
      expect(() => CustomText.getCustomText("bar", true)).toThrow(
        "Custom text bar not found",
      );
    });

    it("should only delete from the matching store", () => {
      CustomText.setCustomText("same", "short text");
      CustomText.setCustomText("same", "long text", true);

      CustomText.deleteCustomText("same", false);
      expect(CustomText.getCustomTextNames(false)).toStrictEqual([]);
      expect(CustomText.getCustomTextNames(true)).toStrictEqual(["same"]);
    });
  });

  describe("migration to the unified schema", () => {
    it("should migrate old short custom text (string values) to objects", () => {
      localStorage.setItem(
        "customText",
        JSON.stringify({ old: "old text", other: "x y z" }),
      );

      expect(CustomText.getCustomText("old")).toStrictEqual(["old", "text"]);
      expect(CustomText.getCustomText("other")).toStrictEqual(["x", "y", "z"]);
      expect(CustomText.getCustomTextNames(false)).toStrictEqual([
        "old",
        "other",
      ]);

      // migrated value written back to localStorage
      expect(
        JSON.parse(localStorage.getItem("customText") ?? "null"),
      ).toStrictEqual({ old: { text: "old text" }, other: { text: "x y z" } });
    });

    it("should keep progress when migrating old long custom text", () => {
      localStorage.setItem(
        "customTextLong",
        JSON.stringify({ old: { text: "a b c", progress: 2 } }),
      );

      expect(CustomText.getCustomText("old", true)).toStrictEqual([
        "a",
        "b",
        "c",
      ]);
      expect(CustomText.getCustomTextLongProgress("old")).toBe(2);
    });

    it("should ignore invalid entries during migration", () => {
      localStorage.setItem(
        "customText",
        JSON.stringify({
          good: "hello",
          badNumber: 42,
          badObject: { unrelated: true },
        }),
      );

      expect(CustomText.getCustomTextNames(false)).toStrictEqual(["good"]);
      expect(CustomText.getCustomText("good")).toStrictEqual(["hello"]);
    });

    it("should fall back to empty for non-object old data", () => {
      localStorage.setItem(
        "customText",
        JSON.stringify(["not", "an", "object"]),
      );
      expect(CustomText.getCustomTextNames(false)).toStrictEqual([]);
    });

    it("should round-trip migrated entries through setCustomText", () => {
      localStorage.setItem("customText", JSON.stringify({ old: "old text" }));

      // trigger migration
      expect(CustomText.getCustomText("old")).toStrictEqual(["old", "text"]);

      // update must work on the migrated structure
      CustomText.setCustomText("old", "new text");
      expect(CustomText.getCustomText("old")).toStrictEqual(["new", "text"]);
    });
  });
});
