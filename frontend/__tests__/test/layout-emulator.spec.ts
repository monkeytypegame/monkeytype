import { describe, it, expect, afterEach } from "vitest";
import {
  updateAltGrState,
  getIsAltGrPressed,
} from "../../src/ts/test/layout-emulator";

describe("LayoutEmulator", () => {
  describe("updateAltGrState", () => {
    afterEach(() => {
      // Reset isAltGrPressed state after each test
      // Simulate keyup event to reset state
      const event = createEvent("AltRight", "keyup");
      updateAltGrState(event);
    });

    const createEvent = (
      code: string,
      type: string
    ): JQuery.KeyboardEventBase =>
      ({
        code,
        type,
      } as JQuery.KeyboardEventBase);

    it("should set isAltGrPressed to true on AltRight keydown", () => {
      const event = createEvent("AltRight", "keydown");
      updateAltGrState(event);
      expect(getIsAltGrPressed()).toBe(true);
    });

    it("should set isAltGrPressed to false on AltRight keyup", () => {
      const event = createEvent("AltRight", "keyup");
      updateAltGrState(event);
      expect(getIsAltGrPressed()).toBe(false);
    });

    it("should set isAltGrPressed to true on AltLeft keydown on Mac", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mac",
        configurable: true,
      });
      const event = createEvent("AltLeft", "keydown");
      updateAltGrState(event);
      expect(getIsAltGrPressed()).toBe(true);
    });

    it("should set isAltGrPressed to false on AltLeft keyup on Mac", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mac",
        configurable: true,
      });
      const event = createEvent("AltLeft", "keyup");
      updateAltGrState(event);
      expect(getIsAltGrPressed()).toBe(false);
    });

    it("should not change isAltGrPressed on AltLeft keydown on non-Mac", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Windows",
        configurable: true,
      });
      const event = createEvent("AltLeft", "keydown");
      updateAltGrState(event);
      expect(getIsAltGrPressed()).toBe(false);
    });

    it("should not change isAltGrPressed on AltLeft keyup on non-Mac", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Windows",
        configurable: true,
      });
      const event = createEvent("AltLeft", "keyup");
      updateAltGrState(event);
      expect(getIsAltGrPressed()).toBe(false);
    });

    it("should not change isAltGrPressed on keydown of other keys", () => {
      const event = createEvent("KeyA", "keydown");
      updateAltGrState(event);
      expect(getIsAltGrPressed()).toBe(false);
    });

    it("should not change isAltGrPressed on keyup of other keys", () => {
      const event = createEvent("KeyA", "keyup");
      updateAltGrState(event);
      expect(getIsAltGrPressed()).toBe(false);
    });
  });
});
