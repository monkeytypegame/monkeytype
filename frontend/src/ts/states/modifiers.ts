import {
  isCapsLockOn as checkCapsLockOn,
  onCapsLockChange,
} from "@leonabcd123/modern-caps-lock";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { createSignal } from "solid-js";
import { createEffectOn } from "../hooks/effects";
import { getActivePage } from "./core";

type ModifierState = {
  shift: boolean;
  altGr: boolean;
  leftShift: boolean;
  rightShift: boolean;
};

export const [getModifierState, { updateModifierState }] =
  createSignalWithSetters<ModifierState>({
    shift: false,
    altGr: false,
    leftShift: false,
    rightShift: false,
  })({
    updateModifierState: (set, val: Partial<Omit<ModifierState, "shift">>) =>
      set((prev) => ({
        ...prev,
        ...val,
        shift: val.leftShift ?? val.rightShift ?? prev.shift,
      })),
  });

const [isCapsLockOn, setCapsLockOn] = createSignal<boolean>(checkCapsLockOn());
export { isCapsLockOn };

onCapsLockChange((state) => setCapsLockOn(state));

const listeners: Array<{ remove: () => void }> = [];

createEffectOn(getActivePage, (page) => {
  // Clean up listeners from previous page.
  for (const listener of listeners) {
    listener.remove();
  }
  listeners.length = 0;

  if (page === "test") {
    const onKeyDown = (e: KeyboardEvent): void => handleModifierState(e, true);
    const onKeyUp = (e: KeyboardEvent): void => handleModifierState(e, false);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    listeners.push(
      {
        remove: (): void => document.removeEventListener("keydown", onKeyDown),
      },
      { remove: (): void => document.removeEventListener("keyup", onKeyUp) },
    );
  }
});

function handleModifierState(e: KeyboardEvent, updateValue: boolean): void {
  if (e.code === "ShiftLeft") updateModifierState({ leftShift: updateValue });
  if (e.code === "ShiftRight") updateModifierState({ rightShift: updateValue });
  if (e.code === "AltRight" || e.code === "AltLeft") {
    updateModifierState({ altGr: updateValue });
  }
}
