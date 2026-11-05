import { JSXElement, onCleanup } from "solid-js";

import { createEffectOn } from "../../hooks/effects";
import { isFocusMode, setFocusMode } from "../../states/test";

// ignore mouse/desk vibration: exit only on movement above this many px
const exitThresholdPx = 3;

/** Leaves focus mode when the mouse moves. Listens only while it's on. */
export function FocusModeExit(): JSXElement {
  createEffectOn(isFocusMode, (focused) => {
    if (!focused) return;
    const onMouseMove = (event: MouseEvent): void => {
      if (
        Math.abs(event.movementX) > exitThresholdPx ||
        Math.abs(event.movementY) > exitThresholdPx
      ) {
        setFocusMode(false);
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    onCleanup(() => document.removeEventListener("mousemove", onMouseMove));
  });
  return null;
}
