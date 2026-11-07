import { describe, expect, it } from "vitest";
import { filterWordList } from "../../../src/ts/components/modals/WordFilterModal";

const exactMatchFilter = {
  include: "a r s t d h n e i o '",
  exclude: "",
  minLength: "",
  maxLength: "",
  regex: "",
  exactMatch: true,
};

describe("filterWordList", () => {
  it("filters against the British spelling", () => {
    expect(filterWordList(exactMatchFilter, ["tire"], true)).toEqual({
      words: [],
    });
  });

  it("keeps the American spelling when British English is disabled", () => {
    expect(filterWordList(exactMatchFilter, ["tire"])).toEqual({
      words: ["tire"],
    });
  });

  it("keeps the original word when its British spelling matches", () => {
    expect(
      filterWordList(
        { ...exactMatchFilter, include: "m a t h s" },
        ["math"],
        true,
      ),
    ).toEqual({ words: ["math"] });
  });

  it("applies length filters to the British spelling", () => {
    expect(
      filterWordList(
        {
          ...exactMatchFilter,
          include: "m a t h s",
          maxLength: "4",
        },
        ["math"],
        true,
      ),
    ).toEqual({ words: [] });
  });
});
