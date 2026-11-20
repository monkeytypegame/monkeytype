import { describe, expect, it } from "vitest";

import { __testing as configTesting } from "../../../src/ts/config/testing";
import * as CustomText from "../../../src/ts/test/custom-text";
import {
  isLongTest,
  takeTestSettings,
} from "../../../src/ts/test/engine/test-settings";

describe("isLongTest", () => {
  it("follows the test settings, not live config", () => {
    configTesting.replaceConfig({ mode: "words", words: 50 });
    takeTestSettings(CustomText.getData());
    expect(isLongTest()).toBe(false);

    configTesting.replaceConfig({ mode: "words", words: 1000 });
    expect(isLongTest()).toBe(false);

    takeTestSettings(CustomText.getData());
    expect(isLongTest()).toBe(true);
  });

  it("is long for a custom text without a limit", () => {
    CustomText.setLimitMode("word");
    CustomText.setLimitValue(0);
    configTesting.replaceConfig({ mode: "custom" });
    takeTestSettings(CustomText.getData());

    expect(isLongTest()).toBe(true);
  });
});
