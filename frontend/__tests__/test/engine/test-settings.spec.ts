import { describe, expect, it } from "vitest";

import { __testing as configTesting } from "../../../src/ts/config/testing";
import * as CustomText from "../../../src/ts/test/custom-text";
import {
  getTestTimeLimit,
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

describe("getTestTimeLimit", () => {
  it("follows the test settings, not live config", () => {
    configTesting.replaceConfig({ mode: "time", time: 30 });
    takeTestSettings(CustomText.getData());
    configTesting.replaceConfig({ mode: "time", time: 60 });

    expect(getTestTimeLimit()).toBe(30);
  });

  it("is the custom text's limit when it's limited by time", () => {
    CustomText.setLimitMode("time");
    CustomText.setLimitValue(45);
    configTesting.replaceConfig({ mode: "custom" });
    takeTestSettings(CustomText.getData());

    expect(getTestTimeLimit()).toBe(45);
  });

  it("is undefined for a test limited by words", () => {
    configTesting.replaceConfig({ mode: "words", words: 50 });
    takeTestSettings(CustomText.getData());

    expect(getTestTimeLimit()).toBeUndefined();
  });
});
