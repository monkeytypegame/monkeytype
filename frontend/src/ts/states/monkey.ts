import { createEffect, createSignal, onCleanup } from "solid-js";
import { getActivePage } from "./core";
import { keycodeToKeyboardSide } from "../utils/key-converter";
import { Keycode } from "../constants/keys";
import { getConfig } from "../config/store";

const [getMonkeyState, setMonkeyState] = createSignal<{
  left: boolean;
  right: boolean;
}>({ left: false, right: false });

export { getMonkeyState };

createEffect(() => {
  setMonkeyState({ left: false, right: false });

  if (getActivePage() === "test" && getConfig.monkey) {
    const onKeyDown = (e: KeyboardEvent): void => handleKey(e, true);
    const onKeyUp = (e: KeyboardEvent): void => handleKey(e, false);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    });
  }
});

const middleKeysState = { left: false, right: false, last: "right" };
function handleKey(event: KeyboardEvent, isKeyDown: boolean): void {
  console.log("handleKey", event.code, isKeyDown, getMonkeyState());
  const { leftSide, rightSide } = keycodeToKeyboardSide(event.code as Keycode);
  let { left, right } = getMonkeyState();

  if (isKeyDown) {
    if (leftSide && rightSide) {
      // if its a middle key handle special case
      if (middleKeysState.last === "left") {
        if (!right) {
          right = true;
          middleKeysState.last = "right";
          middleKeysState.right = true;
        } else if (!left) {
          left = true;
          middleKeysState.last = "left";
          middleKeysState.left = true;
        }
      } else {
        if (!left) {
          left = true;
          middleKeysState.last = "left";
          middleKeysState.left = true;
        } else if (!right) {
          right = true;
          middleKeysState.last = "right";
          middleKeysState.right = true;
        }
      }
    } else {
      // normal key set hand
      left = left || leftSide;
      right = right || rightSide;
    }
  } else {
    //key up event
    if (leftSide && rightSide) {
      // if middle key handle special case
      if (middleKeysState.left && middleKeysState.last === "left") {
        left = false;
        middleKeysState.left = false;
      } else if (middleKeysState.right && middleKeysState.last === "right") {
        right = false;
        middleKeysState.right = false;
      } else {
        left = left && !middleKeysState.left;
        right = right && !middleKeysState.right;
      }
    } else {
      // normal key unset hand
      left = left && !leftSide;
      right = right && !rightSide;
    }
  }
  setMonkeyState({ left, right });
}
