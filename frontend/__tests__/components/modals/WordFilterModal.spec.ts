import { describe, expect, it } from "vitest";

import { filterWordList } from "../../../src/ts/components/modals/WordFilterModal";

const words = ["apple", "banana", "cherry", "date"];

function filter(
  values: Partial<Parameters<typeof filterWordList>[0]>,
): ReturnType<typeof filterWordList> {
  return filterWordList(
    {
      include: "",
      exclude: "",
      minLength: "",
      maxLength: "",
      regex: "",
      exactMatch: false,
      ...values,
    },
    words,
  );
}

describe("filterWordList", () => {
  it("filters by a regex pattern", () => {
    expect(filter({ regex: "an" })).toEqual({ words: ["banana"] });
  });

  it("filters by a regex literal with flags", () => {
    expect(filter({ regex: "/^A/i" })).toEqual({ words: ["apple"] });
  });

  it.each(["(", "[", "a{2,1}", "/(/", "/a/gg"])(
    "returns an error instead of throwing for invalid regex %s",
    (regex) => {
      expect(filter({ regex })).toEqual({ error: "Invalid regex" });
    },
  );
});
