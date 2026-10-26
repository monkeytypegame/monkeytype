// static json (layouts...) read from disk, the test state module loads some
import "../../../../__harness__/mock-static";
import { describe, expect, it } from "vitest";

import { letterAttributes } from "../../../../../src/ts/components/pages/test/result/result-words";

describe("letterAttributes", () => {
  it.each([
    [{}, "untyped", undefined],
    [{ state: "" as const }, "untyped", undefined],
    [{ state: "correct" as const }, "correct", undefined],
    [{ state: "corrected" as const }, "correct", "corrected"],
    [{ state: "incorrect" as const }, "incorrect", undefined],
    [{ state: "incorrect" as const, extra: true }, "extra", undefined],
  ])("maps %o to state %s", (letter, state, corrections) => {
    expect(letterAttributes(letter)).toEqual({
      "data-ui-element": "letter",
      "data-ui-state": state,
      "data-ui-corrections": corrections,
    });
  });

  it("lists both corrections", () => {
    expect(
      letterAttributes({ state: "corrected", extraCorrected: true })[
        "data-ui-corrections"
      ],
    ).toBe("corrected extraCorrected");
  });

  it("marks extra letters typed after a letter and deleted", () => {
    expect(
      letterAttributes({ state: "incorrect", extraCorrected: true })[
        "data-ui-corrections"
      ],
    ).toBe("extraCorrected");
  });
});
