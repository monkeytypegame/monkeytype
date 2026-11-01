import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCommitCharacterType } from "../../../src/ts/input/helpers/util";
import * as FunboxList from "../../../src/ts/test/funbox/list";

vi.mock("../../../src/ts/test/funbox/list", () => ({
  isFunboxActiveWithProperty: vi.fn(),
}));

const isFunboxActiveWithProperty = vi.mocked(
  FunboxList.isFunboxActiveWithProperty,
);

describe("getCommitCharacterType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isFunboxActiveWithProperty.mockReturnValue(false);
  });

  it("returns 'separator' for a regular space", () => {
    expect(
      getCommitCharacterType({
        data: " ",
        inputValue: "tes",
        targetWord: "test",
      }),
    ).toBe("separator");
  });

  it.each([
    ["　", "ideographic"],
    [" ", "non-breaking"],
    [" ", "em"],
    ["​", "zero width"],
  ])("returns 'separator' for %s (%s space)", (data) => {
    expect(
      getCommitCharacterType({ data, inputValue: "tes", targetWord: "test" }),
    ).toBe("separator");
  });

  it("returns 'separator' for a newline", () => {
    expect(
      getCommitCharacterType({
        data: "\n",
        inputValue: "tes",
        targetWord: "test",
      }),
    ).toBe("separator");
  });

  it("returns false for a regular letter when nospace is inactive", () => {
    expect(
      getCommitCharacterType({
        data: "t",
        inputValue: "tes",
        targetWord: "test",
      }),
    ).toBe(false);
    expect(isFunboxActiveWithProperty).toHaveBeenCalledWith("nospace");
  });

  describe("nospace funbox", () => {
    beforeEach(() => {
      isFunboxActiveWithProperty.mockReturnValue(true);
    });

    it("returns 'nospace' when the char completes the target word", () => {
      expect(
        getCommitCharacterType({
          data: "t",
          inputValue: "tes",
          targetWord: "test",
        }),
      ).toBe("nospace");
    });

    it("returns false when the word is not yet complete", () => {
      expect(
        getCommitCharacterType({
          data: "s",
          inputValue: "te",
          targetWord: "test",
        }),
      ).toBe(false);
    });

    it("returns false when input already exceeds the target length", () => {
      expect(
        getCommitCharacterType({
          data: "x",
          inputValue: "test",
          targetWord: "test",
        }),
      ).toBe(false);
    });

    it("still returns 'separator' for a space", () => {
      expect(
        getCommitCharacterType({
          data: " ",
          inputValue: "tes",
          targetWord: "test",
        }),
      ).toBe("separator");
    });
  });
});
