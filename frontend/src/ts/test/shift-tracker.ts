import Config from "../config";
import * as KeyConverter from "../utils/key-converter";

export let leftState = false;
export let rightState = false;

$(document).on("keydown", (e) => {
  if (e.code === "ShiftLeft") {
    leftState = true;
    rightState = false;
  } else if (e.code === "ShiftRight") {
    leftState = false;
    rightState = true;
  }
});

$(document).on("keyup", (e) => {
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    leftState = false;
    rightState = false;
  }
});

export function reset(): void {
  leftState = false;
  rightState = false;
}

export function isUsingOppositeShift(keycode: KeyConverter.Keycode): boolean {
  if (!leftState && !rightState) {
    return true;
  }

  if (Config.oppositeShiftMode === "off") {
    return true;
  }

  const { leftSide, rightSide } = KeyConverter.keycodeToKeyboardSide(keycode);
  if (!leftSide && !rightSide) {
    return true;
  }

  if ((leftState && rightSide) || (rightState && leftSide)) {
    return true;
  }

  return false;
}
