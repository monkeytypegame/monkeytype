import { describe, expect, it } from "vitest";

import { setConfigStore } from "../../src/ts/config/store";
import {
  flashKeymapKey,
  getKeymapFlashState,
  getKeymapHighlightKey,
  highlightKeymapKey,
  isLongTest,
} from "../../src/ts/states/test";
import * as CustomText from "../../src/ts/test/custom-text";
import { markTestPageMounted } from "../../src/ts/test/test-page-state";

describe("isLongTest", () => {
  it("picks up custom text changes when the test page mounts", () => {
    CustomText.setLimitMode("word");
    CustomText.setLimitValue(9);
    setConfigStore("mode", "custom");
    expect(isLongTest()).toBe(false);

    // custom text settings aren't reactive, e.g. edited in the custom text modal
    CustomText.setLimitValue(0);
    markTestPageMounted(new AbortController().signal);

    expect(isLongTest()).toBe(true);
  });
});

describe("keymap", () => {
  it("highlights a key, a space for an empty key", () => {
    highlightKeymapKey("a");
    expect(getKeymapHighlightKey()).toBe("a");

    highlightKeymapKey("");
    expect(getKeymapHighlightKey()).toBe(" ");
  });

  it("flashes a key in react mode, clearing the highlight", () => {
    setConfigStore("keymapMode", "react");
    highlightKeymapKey("b");

    flashKeymapKey("b", false);
    flashKeymapKey("b");

    expect(getKeymapHighlightKey()).toBeUndefined();
    expect(getKeymapFlashState["b"]).toEqual({ tick: 2, correct: true });
  });

  it("doesn't flash outside react mode", () => {
    setConfigStore("keymapMode", "static");

    flashKeymapKey("c");

    expect(getKeymapFlashState["c"]).toBeUndefined();
  });
});
