import { beforeEach, describe, expect, it, vi } from "vitest";

async function importCustomText(): Promise<
  typeof import("../../src/ts/test/custom-text")
> {
  vi.resetModules();
  window.localStorage.clear();
  return await import("../../src/ts/test/custom-text");
}

describe("custom text", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses language words when custom text is untouched default", async () => {
    const CustomText = await importCustomText();

    expect(CustomText.getEffectiveText(["uno", "dos", "tres"])).toEqual([
      "uno",
      "dos",
      "tres",
    ]);
  });

  it("keeps user custom text instead of language words", async () => {
    const CustomText = await importCustomText();

    CustomText.setText(["custom", "words"]);

    expect(CustomText.getEffectiveText(["uno", "dos", "tres"])).toEqual([
      "custom",
      "words",
    ]);
  });

  it("keeps explicitly set default text instead of language words", async () => {
    const CustomText = await importCustomText();

    CustomText.setText([
      "The",
      "quick",
      "brown",
      "fox",
      "jumps",
      "over",
      "the",
      "lazy",
      "dog",
    ]);

    expect(CustomText.getEffectiveText(["uno", "dos", "tres"])).toEqual([
      "The",
      "quick",
      "brown",
      "fox",
      "jumps",
      "over",
      "the",
      "lazy",
      "dog",
    ]);
  });

  it("returns stored text for UI", async () => {
    const CustomText = await importCustomText();

    expect(CustomText.getStoredText()).toEqual([
      "The",
      "quick",
      "brown",
      "fox",
      "jumps",
      "over",
      "the",
      "lazy",
      "dog",
    ]);
  });
});
