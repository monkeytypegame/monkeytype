import { LayoutObject } from "@monkeytype/schemas/layouts";
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAnimate } = vi.hoisted(() => ({
  mockAnimate: vi
    .fn()
    .mockReturnValue({ pause: vi.fn(), then: vi.fn(async () => undefined) }),
}));

vi.mock("animejs", () => ({
  animate: mockAnimate,
}));

// a canned layout so the keymap renders synchronously without the network
vi.mock("../../../../src/ts/states/test", async () => {
  const qwertyLayout = (await import("../../../../static/layouts/qwerty.json"))
    .default as LayoutObject;
  return {
    getKeymapFlashState: () => ({}),
    getKeymapHighlightKey: () => "",
    getKeymapLayout: () => ({
      layout: "qwerty",
      layoutNameDisplayString: "qwerty",
      isMirrored: false,
    }),
    keymapLayoutObject: () => qwertyLayout,
    setKeymapFlashState: vi.fn(),
    wordsHaveNumbers: () => false,
  };
});

import { Keymap } from "../../../../src/ts/components/pages/test/Keymap";
import { __testing } from "../../../../src/ts/config/testing";

const { replaceConfig } = __testing;

describe("Keymap", () => {
  afterEach(() => {
    cleanup();
    replaceConfig({});
    mockAnimate.mockClear();
  });

  it("renders the 3d keymap when keymapDimension is 3d", () => {
    replaceConfig({ keymapMode: "static", keymapDimension: "3d" });

    const { container } = render(() => <Keymap />);

    expect(container.querySelector("[data-keymap3d-root]")).toBeTruthy();
    expect(container.querySelectorAll("[data-keycap]").length).toBeGreaterThan(
      0,
    );
  });

  it("renders the 2d keymap by default", () => {
    replaceConfig({ keymapMode: "static" });

    const { container } = render(() => <Keymap />);

    expect(container.querySelector("[data-keymap3d-root]")).toBeFalsy();
    // the 2d keys are flat divs with a border
    const key = container.querySelector(".border-bg");
    expect(key).toBeTruthy();
    expect(container.textContent).toContain("q");
  });
});
