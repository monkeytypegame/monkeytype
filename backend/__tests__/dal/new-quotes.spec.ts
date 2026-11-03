import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import * as NewQuotesDal from "../../src/dal/new-quotes";

vi.mock("simple-git", () => ({
  simpleGit: () => {
    throw new Error("no repo");
  },
}));

describe("NewQuotesDal", () => {
  describe("without git", () => {
    it("add fails", async () => {
      await expect(
        NewQuotesDal.add("text", "source", "english", "uid"),
      ).rejects.toThrow("Git not available.");
    });
    it("get fails", async () => {
      await expect(NewQuotesDal.get("all")).rejects.toThrow(
        "Git not available.",
      );
    });
    it("approve fails", async () => {
      await expect(
        NewQuotesDal.approve(
          new ObjectId().toHexString(),
          undefined,
          undefined,
          "name",
        ),
      ).rejects.toThrow("Git not available.");
    });
    it("refuse fails", async () => {
      await expect(
        NewQuotesDal.refuse(new ObjectId().toHexString()),
      ).rejects.toThrow("Git not available.");
    });
  });
});
