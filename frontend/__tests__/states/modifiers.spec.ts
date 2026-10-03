import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { setActivePage } from "../../src/ts/states/core";
import {
  getModifierState,
  resetModifierState,
} from "../../src/ts/states/modifiers";
import { isUsingOppositeShift } from "../../src/ts/test/shift-tracker";
import { __testing } from "../../src/ts/config/testing";

const { replaceConfig } = __testing;

function press(
  type: "keydown" | "keyup",
  code: string,
  shiftKey: boolean,
  target: EventTarget = document,
): void {
  target.dispatchEvent(
    new KeyboardEvent(type, { code, shiftKey, bubbles: true }),
  );
}

describe("modifiers", () => {
  beforeAll(() => {
    setActivePage("test");
  });

  beforeEach(() => {
    resetModifierState();
  });

  it("tracks left and right shift", () => {
    press("keydown", "ShiftLeft", true);
    expect(getModifierState()).toMatchObject({
      shift: true,
      leftShift: true,
      rightShift: false,
    });

    press("keydown", "ShiftRight", true);
    expect(getModifierState()).toMatchObject({
      leftShift: true,
      rightShift: true,
    });

    press("keyup", "ShiftLeft", true);
    expect(getModifierState()).toMatchObject({
      shift: true,
      leftShift: false,
      rightShift: true,
    });

    press("keyup", "ShiftRight", false);
    expect(getModifierState()).toMatchObject({
      shift: false,
      leftShift: false,
      rightShift: false,
    });
  });

  it("clears a shift whose keyup never fired", () => {
    // windows only fires keyup for the last released shift when both are held
    press("keydown", "ShiftRight", true);
    press("keydown", "ShiftLeft", true);
    press("keyup", "ShiftLeft", false);

    expect(getModifierState()).toMatchObject({
      shift: false,
      leftShift: false,
      rightShift: false,
    });
  });

  it("clears a stuck shift on the next unshifted key", () => {
    press("keydown", "ShiftRight", true);
    press("keydown", "KeyO", false);

    expect(getModifierState()).toMatchObject({
      shift: false,
      rightShift: false,
    });
  });

  it("updates before listeners on the input element run", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    let rightShiftSeen: boolean | undefined;
    input.addEventListener("keydown", () => {
      rightShiftSeen = getModifierState().rightShift;
    });

    press("keydown", "ShiftRight", true);
    press("keydown", "KeyO", false, input);

    expect(rightShiftSeen).toBe(false);
    input.remove();
  });

  it("doesn't reject unshifted keys after a stuck shift", () => {
    replaceConfig({ oppositeShiftMode: "on" });

    press("keydown", "ShiftRight", true);
    press("keydown", "ShiftLeft", true);
    press("keyup", "ShiftLeft", false);
    press("keydown", "KeyO", false);

    expect(isUsingOppositeShift("KeyO")).toBe(true);
  });
});
