import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import { setConfigStore } from "../../src/ts/config/store";
import { getTimerText } from "../../src/ts/states/live-stats";
import { setIsTestRestarting } from "../../src/ts/states/test";
import * as CustomText from "../../src/ts/test/custom-text";

describe("live-stats", () => {
  describe("getTimerText", () => {
    it("updates progress text immediately when test is restarted after custom text limit change", () => {
      createRoot((dispose) => {
        setConfigStore("mode", "custom");
        CustomText.setLimitMode("word");
        CustomText.setLimitValue(9);

        expect(getTimerText()).toBe("0/9");

        // Update custom text limit (simulating custom text change to 2 words)
        CustomText.setLimitValue(2);

        // Trigger test restart signals (as occurs in restart())
        setIsTestRestarting(true);
        setIsTestRestarting(false);

        // Progress text should immediately reflect the updated total without typing
        expect(getTimerText()).toBe("0/2");

        dispose();
      });
    });
  });
});
