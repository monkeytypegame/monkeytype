import {
  isCapsLockOn as checkCapsLockOn,
  onCapsLockChange,
} from "@leonabcd123/modern-caps-lock";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { createSignal, onCleanup } from "solid-js";
import { createEffectOn } from "../hooks/effects";
import { getActivePage } from "./core";
import { listenForKeyState } from "../utils/key-state";

type ModifierState = {
  shift: boolean;
  alt: boolean;
  leftShift: boolean;
  rightShift: boolean;
};

export const [getModifierState, { updateModifierState }] =
  createSignalWithSetters<ModifierState>({
    shift: false,
    alt: false,
    leftShift: false,
    rightShift: false,
  })({
    updateModifierState: (set, val: Partial<ModifierState>) =>
      set((prev) => {
        const leftShift = val.leftShift ?? prev.leftShift;
        const rightShift = val.rightShift ?? prev.rightShift;
        return {
          ...prev,
          ...val,
          leftShift,
          rightShift,
          shift: val.shift ?? (leftShift || rightShift),
        };
      }),
  });

export function resetModifierState(): void {
  updateModifierState({
    shift: false,
    alt: false,
    leftShift: false,
    rightShift: false,
  });
}

const [isCapsLockOn, setCapsLockOn] = createSignal<boolean>(checkCapsLockOn());
export { isCapsLockOn };

onCapsLockChange((state) => setCapsLockOn(state));

createEffectOn(getActivePage, (page) => {
  if (page !== "test") return;
  const controller = new AbortController();
  listenForKeyState(controller.signal, handleModifierState, resetModifierState);
  onCleanup(() => controller.abort());
});

function handleModifierState(e: KeyboardEvent, updateValue: boolean): void {
  if (e.code === "ShiftLeft") updateModifierState({ leftShift: updateValue });
  if (e.code === "ShiftRight") updateModifierState({ rightShift: updateValue });
  if (e.code === "AltRight" || e.code === "AltLeft") {
    updateModifierState({ alt: updateValue });
  }
}
