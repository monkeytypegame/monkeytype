import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const testState = vi.hoisted(() => ({
  composing: false,
  active: true,
  compositionData: "",
}));

vi.mock("../../../src/ts/states/test", () => ({
  isComposing: () => testState.composing,
  isTestActive: () => testState.active,
  setCompositionData: (value: string) => {
    testState.compositionData = value;
  },
}));

const testUI = vi.hoisted(() => ({ afterTestCompositionUpdate: vi.fn() }));
vi.mock("../../../src/ts/test/test-ui", () => testUI);

import {
  onDeadKeyDown,
  clearDeadKey,
  cancelDeadKeyOnBackspace,
} from "../../../src/ts/input/helpers/dead-key";
import {
  isDeadKeyPending,
  setDeadKeyPending,
} from "../../../src/ts/input/state";

function keyEvent(
  key: string,
  code: string,
  mods: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  return new KeyboardEvent("keydown", { key, code, cancelable: true, ...mods });
}

describe("dead-key", () => {
  beforeEach(() => {
    testState.composing = false;
    testState.active = true;
    testState.compositionData = "";
    setDeadKeyPending(false);
    testUI.afterTestCompositionUpdate.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("onDeadKeyDown", () => {
    it("shows a placeholder when the layout map is unavailable", async () => {
      await onDeadKeyDown(keyEvent("Dead", "BracketLeft"));
      expect(isDeadKeyPending()).toBe(true);
      expect(testState.compositionData).toBe("◌");
      expect(testUI.afterTestCompositionUpdate).toHaveBeenCalledOnce();
    });

    it("does nothing while a real composition is active", async () => {
      testState.composing = true;
      await onDeadKeyDown(keyEvent("Dead", "BracketLeft"));
      expect(isDeadKeyPending()).toBe(false);
      expect(testState.compositionData).toBe("");
    });

    it("only marks pending before the test starts", async () => {
      testState.active = false;
      await onDeadKeyDown(keyEvent("Dead", "BracketLeft"));
      expect(isDeadKeyPending()).toBe(true);
      expect(testState.compositionData).toBe("");
      expect(testUI.afterTestCompositionUpdate).not.toHaveBeenCalled();
    });
  });

  describe("clearDeadKey", () => {
    it("clears pending state and composition data", async () => {
      await onDeadKeyDown(keyEvent("Dead", "BracketLeft"));
      clearDeadKey();
      expect(isDeadKeyPending()).toBe(false);
      expect(testState.compositionData).toBe("");
    });

    it("does nothing when no dead key is pending", () => {
      testState.compositionData = "abc";
      clearDeadKey(true);
      expect(testState.compositionData).toBe("abc");
      expect(testUI.afterTestCompositionUpdate).not.toHaveBeenCalled();
    });
  });

  describe("cancelDeadKeyOnBackspace", () => {
    it("consumes backspace and cancels the pending accent", async () => {
      await onDeadKeyDown(keyEvent("Dead", "BracketLeft"));
      testUI.afterTestCompositionUpdate.mockClear();
      const event = keyEvent("Backspace", "Backspace");

      expect(cancelDeadKeyOnBackspace(event)).toBe(true);
      expect(event.defaultPrevented).toBe(true);
      expect(isDeadKeyPending()).toBe(false);
      expect(testState.compositionData).toBe("");
      expect(testUI.afterTestCompositionUpdate).toHaveBeenCalledOnce();
    });

    it("lets backspace through when no dead key is pending", () => {
      const event = keyEvent("Backspace", "Backspace");
      expect(cancelDeadKeyOnBackspace(event)).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });

    it("lets backspace through during a real composition", () => {
      setDeadKeyPending(true);
      testState.composing = true;
      const event = keyEvent("Backspace", "Backspace");
      expect(cancelDeadKeyOnBackspace(event)).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  // keep last: the layout map is cached once loaded
  describe("with keyboard layout map", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", {
        keyboard: {
          getLayoutMap: async () => new Map([["BracketLeft", "^"]]),
        },
      });
    });

    it("shows the actual accent", async () => {
      await onDeadKeyDown(keyEvent("Dead", "BracketLeft"));
      expect(testState.compositionData).toBe("^");
    });

    it("shows a placeholder for modified dead keys", async () => {
      await onDeadKeyDown(keyEvent("Dead", "BracketLeft", { shiftKey: true }));
      expect(testState.compositionData).toBe("◌");
    });
  });
});
