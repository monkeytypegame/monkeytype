import { Config } from "../config/store";
import { Keycode } from "../constants/keys";
import { getModifierState } from "../states/modifiers";
import * as KeyConverter from "../utils/key-converter";

export function isUsingOppositeShift(keycode: Keycode): boolean {
  const { leftShift, rightShift } = getModifierState();
  if (!leftShift && !rightShift) {
    return true;
  }

  if (Config.oppositeShiftMode === "off") {
    return true;
  }

  const { leftSide, rightSide } = KeyConverter.keycodeToKeyboardSide(keycode);
  if (!leftSide && !rightSide) {
    return true;
  }

  if ((leftShift && rightSide) || (rightShift && leftSide)) {
    return true;
  }

  return false;
}
