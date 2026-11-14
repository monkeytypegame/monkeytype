import { describe, it, expect, beforeEach, vi } from "vitest";

const testState = vi.hoisted(() => ({ composing: false }));

vi.mock("../../../src/ts/states/test", () => ({
  isComposing: () => testState.composing,
}));

import {
  onDeadKeyDown,
  clearDeadKey,
  cancelDeadKeyOnBackspace,
} from "../../../src/ts/input/helpers/dead-key";
import {
  isDeadKeyPending,
  setDeadKeyPending,
} from "../../../src/ts/input/state";

function backspace(): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key: "Backspace",
    code: "Backspace",
    cancelable: true,
  });
}

describe("dead-key", () => {
  beforeEach(() => {
    testState.composing = false;
    setDeadKeyPending(false);
  });

  it("marks a dead key as pending", () => {
    onDeadKeyDown();
    expect(isDeadKeyPending()).toBe(true);
  });

  it("ignores dead keys during a real composition", () => {
    testState.composing = true;
    onDeadKeyDown();
    expect(isDeadKeyPending()).toBe(false);
  });

  it("clears the pending dead key", () => {
    onDeadKeyDown();
    clearDeadKey();
    expect(isDeadKeyPending()).toBe(false);
  });

  describe("cancelDeadKeyOnBackspace", () => {
    it("consumes backspace and cancels the pending accent", () => {
      onDeadKeyDown();
      const event = backspace();
      expect(cancelDeadKeyOnBackspace(event)).toBe(true);
      expect(event.defaultPrevented).toBe(true);
      expect(isDeadKeyPending()).toBe(false);
    });

    it("only consumes one backspace", () => {
      onDeadKeyDown();
      cancelDeadKeyOnBackspace(backspace());
      const event = backspace();
      expect(cancelDeadKeyOnBackspace(event)).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });

    it("lets backspace through when no dead key is pending", () => {
      const event = backspace();
      expect(cancelDeadKeyOnBackspace(event)).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });

    it("lets backspace through during a real composition", () => {
      setDeadKeyPending(true);
      testState.composing = true;
      const event = backspace();
      expect(cancelDeadKeyOnBackspace(event)).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });
  });
});
