import { describe, expect, it } from "vitest";

import { setConfigStore } from "../../src/ts/config/store";
import { isLongTest } from "../../src/ts/states/test";
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
